import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

// Get all users (Admin only)
const getAllUsers = async (filters: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, role, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            isAvailable: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get user by ID (Admin only)
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
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
      bookings: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Update user status (ban/unban) - Admin only
const updateUserStatus = async (id: string, status: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent banning admin users
  if (user.role === "ADMIN") {
    throw new ApiError(400, "Cannot modify admin user status");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

// Update user role - Admin only
const updateUserRole = async (id: string, role: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent changing own role or demoting other admins
  if (user.role === "ADMIN") {
    throw new ApiError(400, "Cannot modify admin user role");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

// Get all bookings (Admin only)
const getAllBookings = async (filters: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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

// Get dashboard stats (Admin only)
const getDashboardStats = async () => {
  const [
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    pendingBookings,
    completedBookings,
    totalCategories,
    totalReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.category.count(),
    prisma.review.count(),
  ]);

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: { name: true, email: true },
      },
      tutorProfile: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  // Get top tutors by rating
  const topTutors = await prisma.tutorProfile.findMany({
    take: 5,
    orderBy: { rating: "desc" },
    where: { totalReviews: { gt: 0 } },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
    },
  });

  return {
    stats: {
      totalUsers,
      totalTutors,
      totalStudents,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalCategories,
      totalReviews,
    },
    recentBookings,
    topTutors,
  };
};

export const AdminService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getAllBookings,
  getDashboardStats,
};
