import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { BookingStatus } from "../../../generated/prisma/client";

// Create a review (Student only, after completed booking)
const createReview = async (
  studentId: string,
  data: {
    bookingId: string;
    rating: number;
    comment?: string;
  },
) => {
  const { bookingId, rating, comment } = data;

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutorProfile: true,
      review: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check if the student owns this booking
  if (booking.studentId !== studentId) {
    throw new ApiError(403, "You can only review your own bookings");
  }

  // Check if booking is completed
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new ApiError(400, "You can only review completed sessions");
  }

  // Check if review already exists
  if (booking.review) {
    throw new ApiError(400, "You have already reviewed this session");
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      rating,
      comment: comment ?? null,
      studentId,
      tutorProfileId: booking.tutorProfileId,
      bookingId,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      tutorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // Update tutor's rating and review count
  const tutorReviews = await prisma.review.findMany({
    where: { tutorProfileId: booking.tutorProfileId },
    select: { rating: true },
  });

  const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / tutorReviews.length;

  await prisma.tutorProfile.update({
    where: { id: booking.tutorProfileId },
    data: {
      rating: averageRating,
      totalReviews: tutorReviews.length,
    },
  });

  return review;
};

// Get reviews for a tutor (Public)
const getTutorReviews = async (
  tutorProfileId: string,
  filters: {
    page?: number;
    limit?: number;
  },
) => {
  const { page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
  });

  if (!tutorProfile) {
    throw new ApiError(404, "Tutor not found");
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { tutorProfileId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.review.count({ where: { tutorProfileId } }),
  ]);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get my reviews (Student - reviews they've written)
const getMyReviews = async (
  studentId: string,
  filters: {
    page?: number;
    limit?: number;
  },
) => {
  const { page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { studentId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),
    prisma.review.count({ where: { studentId } }),
  ]);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Update review (Student only, within 24 hours)
const updateReview = async (
  id: string,
  studentId: string,
  data: {
    rating?: number;
    comment?: string;
  },
) => {
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.studentId !== studentId) {
    throw new ApiError(403, "You can only update your own reviews");
  }

  // Check if within 24 hours of creation
  const hoursSinceCreation =
    (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation > 24) {
    throw new ApiError(400, "You can only edit reviews within 24 hours");
  }

  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Recalculate tutor's average rating
  const tutorReviews = await prisma.review.findMany({
    where: { tutorProfileId: review.tutorProfileId },
    select: { rating: true },
  });

  const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / tutorReviews.length;

  await prisma.tutorProfile.update({
    where: { id: review.tutorProfileId },
    data: { rating: averageRating },
  });

  return updatedReview;
};

// Delete review (Admin only)
const deleteReview = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  await prisma.review.delete({
    where: { id },
  });

  // Recalculate tutor's average rating
  const tutorReviews = await prisma.review.findMany({
    where: { tutorProfileId: review.tutorProfileId },
    select: { rating: true },
  });

  if (tutorReviews.length > 0) {
    const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / tutorReviews.length;

    await prisma.tutorProfile.update({
      where: { id: review.tutorProfileId },
      data: {
        rating: averageRating,
        totalReviews: tutorReviews.length,
      },
    });
  } else {
    await prisma.tutorProfile.update({
      where: { id: review.tutorProfileId },
      data: {
        rating: 0,
        totalReviews: 0,
      },
    });
  }

  return null;
};

export const ReviewService = {
  createReview,
  getTutorReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
