import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { BookingStatus, PaymentStatus } from "../../../generated/prisma/client";
import { config } from "../../config";

// Create a new booking (Student only)
const createBooking = async (
  studentId: string,
  data: {
    tutorProfileId: string;
    scheduledAt: string;
    duration?: number;
    notes?: string;
  },
) => {
  const { tutorProfileId, scheduledAt, duration = 60, notes } = data;

  // Check if tutor exists and is available
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    include: {
      user: true,
      availabilities: true,
    },
  });

  if (!tutorProfile) {
    throw new ApiError(404, "Tutor not found");
  }

  if (!tutorProfile.isAvailable) {
    throw new ApiError(400, "Tutor is not available for bookings");
  }

  // Prevent self-booking
  if (tutorProfile.userId === studentId) {
    throw new ApiError(400, "You cannot book a session with yourself");
  }

  const scheduledDate = new Date(scheduledAt);

  // Check if the scheduled time is in the future
  if (scheduledDate <= new Date()) {
    throw new ApiError(400, "Scheduled time must be in the future");
  }

  // Check if tutor is available on that day/time
  const dayOfWeek = scheduledDate.getDay();
  const time = scheduledDate.toTimeString().slice(0, 5); // HH:mm format

  const availableSlot = tutorProfile.availabilities.find(
    (a) =>
      a.dayOfWeek === dayOfWeek && a.startTime <= time && a.endTime >= time,
  );

  if (!availableSlot) {
    throw new ApiError(400, "Tutor is not available at the selected time");
  }

  // Check for conflicting bookings
  const endTime = new Date(scheduledDate.getTime() + duration * 60000);
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      tutorProfileId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      scheduledAt: {
        gte: new Date(scheduledDate.getTime() - duration * 60000),
        lt: endTime,
      },
    },
  });

  if (conflictingBooking) {
    throw new ApiError(400, "Tutor already has a booking at this time");
  }

  const amount = Math.round((tutorProfile.hourlyRate * duration * 100) / 60);

  const booking = await prisma.booking.create({
    data: {
      studentId,
      tutorProfileId,
      scheduledAt: scheduledDate,
      duration,
      amount,
      currency: config.stripe.currency,
      notes: notes ?? null,
      status: BookingStatus.PENDING,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return booking;
};

// Get user's bookings (Student or Tutor)
const getMyBookings = async (
  userId: string,
  userRole: string,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  },
) => {
  const { status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  let where: any = {};

  if (userRole === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (tutorProfile) {
      where.tutorProfileId = tutorProfile.id;
    } else {
      where.studentId = userId;
    }
  } else {
    where.studentId = userId;
  }

  if (status) {
    // Handle comma-separated status values (e.g., "PENDING,CONFIRMED")
    const statusValues = status
      .split(",")
      .map((s) => s.trim()) as BookingStatus[];
    if (statusValues.length > 1) {
      where.status = { in: statusValues };
    } else {
      where.status = statusValues[0];
    }
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        review: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get booking by ID
const getBookingById = async (id: string, userId: string, userRole: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
        },
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
            },
          },
        },
      },
      review: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check authorization
  if (userRole !== "ADMIN") {
    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutorProfile.userId === userId;

    if (!isStudent && !isTutor) {
      throw new ApiError(403, "You are not authorized to view this booking");
    }
  }

  return booking;
};

// Update booking status
const updateBookingStatus = async (
  id: string,
  userId: string,
  userRole: string,
  status: BookingStatus,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tutorProfile: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Authorization checks
  const isStudent = booking.studentId === userId;
  const isTutor = booking.tutorProfile.userId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isStudent && !isTutor && !isAdmin) {
    throw new ApiError(403, "You are not authorized to update this booking");
  }

  // Status transition rules
  if (booking.status === BookingStatus.CANCELLED) {
    throw new ApiError(400, "Cannot update a cancelled booking");
  }

  if (booking.status === BookingStatus.COMPLETED) {
    throw new ApiError(400, "Cannot update a completed booking");
  }

  // Confirmed/completed sessions require successful payment.
  if (
    (status === BookingStatus.CONFIRMED ||
      status === BookingStatus.COMPLETED) &&
    booking.paymentStatus !== PaymentStatus.PAID
  ) {
    throw new ApiError(
      400,
      "Booking can only be confirmed or completed after payment is completed",
    );
  }

  if (
    status === BookingStatus.COMPLETED &&
    booking.status !== BookingStatus.CONFIRMED
  ) {
    throw new ApiError(
      400,
      "Booking can only be completed after it is confirmed",
    );
  }

  // Students can only cancel
  if (isStudent && !isAdmin && status !== BookingStatus.CANCELLED) {
    throw new ApiError(400, "Students can only cancel bookings");
  }

  // Tutors can confirm, complete, or cancel
  if (isTutor && !isAdmin) {
    const allowedStatuses: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ];
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status transition for tutor");
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return updatedBooking;
};

// Cancel booking
const cancelBooking = async (id: string, userId: string, userRole: string) => {
  return updateBookingStatus(id, userId, userRole, BookingStatus.CANCELLED);
};

// Confirm booking (Tutor only)
const confirmBooking = async (id: string, userId: string, userRole: string) => {
  return updateBookingStatus(id, userId, userRole, BookingStatus.CONFIRMED);
};

// Complete booking (Tutor only)
const completeBooking = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  return updateBookingStatus(id, userId, userRole, BookingStatus.COMPLETED);
};

// Update booking status (Admin only - can set any status)
const updateStatus = async (id: string, status: string) => {
  // Validate status
  if (!Object.values(BookingStatus).includes(status as BookingStatus)) {
    throw new ApiError(400, `Invalid status: ${status}`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const nextStatus = status as BookingStatus;

  if (
    (nextStatus === BookingStatus.CONFIRMED ||
      nextStatus === BookingStatus.COMPLETED) &&
    booking.paymentStatus !== PaymentStatus.PAID
  ) {
    throw new ApiError(
      400,
      "Booking can only be confirmed or completed after payment is completed",
    );
  }

  if (
    nextStatus === BookingStatus.COMPLETED &&
    booking.status !== BookingStatus.CONFIRMED
  ) {
    throw new ApiError(
      400,
      "Booking can only be completed after it is confirmed",
    );
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status: nextStatus },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return updatedBooking;
};

export const BookingService = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  confirmBooking,
  completeBooking,
  updateStatus,
};
