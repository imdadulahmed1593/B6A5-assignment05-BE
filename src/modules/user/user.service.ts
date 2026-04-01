import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

// Get current user profile
const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      emailVerified: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      tutorProfile: {
        include: {
          categories: {
            include: { category: true },
          },
          _count: {
            select: { bookings: true, reviews: true },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Update user profile
const updateProfile = async (
  userId: string,
  data: {
    name?: string;
    phone?: string;
    image?: string;
  },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      phone: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// Get user's dashboard data
const getDashboard = async (userId: string, userRole: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let dashboardData: any = { user };

  if (userRole === "TUTOR") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { bookings: true, reviews: true },
        },
      },
    });

    if (tutorProfile) {
      // Get upcoming sessions
      const upcomingSessions = await prisma.booking.findMany({
        where: {
          tutorProfileId: tutorProfile.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          scheduledAt: { gte: new Date() },
        },
        take: 5,
        orderBy: { scheduledAt: "asc" },
        include: {
          student: {
            select: { name: true, email: true, image: true },
          },
        },
      });

      // Get recent reviews
      const recentReviews = await prisma.review.findMany({
        where: { tutorProfileId: tutorProfile.id },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { name: true, image: true },
          },
        },
      });

      dashboardData = {
        ...dashboardData,
        tutorProfile: {
          rating: tutorProfile.rating,
          totalReviews: tutorProfile.totalReviews,
          totalBookings: tutorProfile._count.bookings,
          isAvailable: tutorProfile.isAvailable,
        },
        upcomingSessions,
        recentReviews,
      };
    }
  } else {
    // Student dashboard
    const upcomingSessions = await prisma.booking.findMany({
      where: {
        studentId: userId,
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: { gte: new Date() },
      },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: { name: true, email: true, image: true },
            },
          },
        },
      },
    });

    const stats = await prisma.booking.groupBy({
      by: ["status"],
      where: { studentId: userId },
      _count: true,
    });

    dashboardData = {
      ...dashboardData,
      upcomingSessions,
      bookingStats: stats,
    };
  }

  return dashboardData;
};

export const UserService = {
  getMyProfile,
  getDashboard,
  updateProfile,
};
