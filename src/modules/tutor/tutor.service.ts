import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

interface TutorFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface RecommendationFilters {
  categoryId?: string;
  limit?: number;
}

// Get all tutors with filters (Public)
const getAllTutors = async (filters: TutorFilters) => {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    isAvailable,
    page = 1,
    limit = 10,
    sortBy = "rating",
    sortOrder = "desc",
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {};

  // Search by tutor name or bio
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by category
  if (categoryId) {
    where.categories = {
      some: { categoryId },
    };
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.hourlyRate = {};
    if (minPrice !== undefined) where.hourlyRate.gte = minPrice;
    if (maxPrice !== undefined) where.hourlyRate.lte = maxPrice;
  }

  // Filter by minimum rating
  if (minRating !== undefined) {
    where.rating = { gte: minRating };
  }

  // Filter by availability
  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable;
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === "price") {
    orderBy.hourlyRate = sortOrder;
  } else if (sortBy === "experience") {
    orderBy.experience = sortOrder;
  } else {
    orderBy.rating = sortOrder;
  }

  const [tutors, total] = await Promise.all([
    prisma.tutorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        availabilities: true,
        _count: {
          select: { reviews: true, bookings: true },
        },
      },
    }),
    prisma.tutorProfile.count({ where }),
  ]);

  return {
    tutors,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get tutor by ID (Public)
const getTutorById = async (id: string) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id },
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
      categories: {
        include: {
          category: true,
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      reviews: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!tutor) {
    throw new ApiError(404, "Tutor not found");
  }

  return tutor;
};

const getSearchSuggestions = async (query: string, limit = 6) => {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const tutors = await prisma.tutorProfile.findMany({
    where: {
      OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { bio: { contains: q, mode: "insensitive" } },
        {
          categories: {
            some: {
              category: { name: { contains: q, mode: "insensitive" } },
            },
          },
        },
      ],
      isAvailable: true,
    },
    take: limit,
    orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      categories: {
        include: { category: true },
      },
    },
  });

  return tutors.map((tutor) => ({
    tutorId: tutor.id,
    name: tutor.user.name,
    categories: tutor.categories.map((item) => item.category.name),
    rating: tutor.rating,
  }));
};

const getRecommendations = async (filters: RecommendationFilters) => {
  const { categoryId, limit = 8 } = filters;

  const where: any = {
    isAvailable: true,
  };

  if (categoryId) {
    where.categories = {
      some: { categoryId },
    };
  }

  const tutors = await prisma.tutorProfile.findMany({
    where,
    take: limit,
    orderBy: [
      { rating: "desc" },
      { totalReviews: "desc" },
      { experience: "desc" },
    ],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: { reviews: true, bookings: true },
      },
    },
  });

  return tutors;
};

// Create tutor profile (Authenticated users who want to become tutors)
const createTutorProfile = async (
  userId: string,
  data: {
    bio?: string;
    hourlyRate: number;
    experience?: number;
    categoryIds?: string[];
  },
) => {
  // Check if user already has a tutor profile
  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new ApiError(400, "You already have a tutor profile");
  }

  const { categoryIds, ...profileData } = data;

  // Build create data
  const createData: any = {
    ...profileData,
    userId,
  };

  if (categoryIds && categoryIds.length > 0) {
    createData.categories = {
      create: categoryIds.map((categoryId) => ({
        categoryId,
      })),
    };
  }

  // Create tutor profile with categories
  const tutorProfile = await prisma.tutorProfile.create({
    data: createData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Update user role to TUTOR
  await prisma.user.update({
    where: { id: userId },
    data: { role: "TUTOR" },
  });

  return tutorProfile;
};

// Update tutor profile (Tutor only)
const updateTutorProfile = async (
  userId: string,
  data: {
    bio?: string;
    hourlyRate?: number;
    experience?: number;
    isAvailable?: boolean;
    categoryIds?: string[];
  },
) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }

  const { categoryIds, ...profileData } = data;

  // Update categories if provided
  if (categoryIds) {
    // Delete existing categories
    await prisma.tutorCategory.deleteMany({
      where: { tutorProfileId: tutorProfile.id },
    });

    // Create new categories
    await prisma.tutorCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        tutorProfileId: tutorProfile.id,
        categoryId,
      })),
    });
  }

  const updatedProfile = await prisma.tutorProfile.update({
    where: { userId },
    data: profileData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      availabilities: true,
    },
  });

  return updatedProfile;
};

// Update tutor availability (Tutor only)
const updateAvailability = async (
  userId: string,
  availabilities: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[],
) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }

  // Delete existing availabilities
  await prisma.tutorAvailability.deleteMany({
    where: { tutorProfileId: tutorProfile.id },
  });

  // Create new availabilities
  await prisma.tutorAvailability.createMany({
    data: availabilities.map((a) => ({
      ...a,
      tutorProfileId: tutorProfile.id,
    })),
  });

  const updatedProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  return updatedProfile;
};

// Get my tutor profile (Tutor only)
const getMyProfile = async (userId: string) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
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
      categories: {
        include: {
          category: true,
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      _count: {
        select: { reviews: true, bookings: true },
      },
    },
  });

  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }

  return tutorProfile;
};

// Get tutor's bookings (Tutor only)
const getMyBookings = async (
  userId: string,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  },
) => {
  const { status, page = 1, limit = 10 } = filters;

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutorProfile) {
    throw new ApiError(404, "Tutor profile not found");
  }

  const skip = (page - 1) * limit;

  const where: any = {
    tutorProfileId: tutorProfile.id,
  };

  if (status) {
    where.status = status;
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

export const TutorService = {
  getAllTutors,
  getTutorById,
  getSearchSuggestions,
  getRecommendations,
  createTutorProfile,
  updateTutorProfile,
  updateAvailability,
  getMyProfile,
  getMyBookings,
};
