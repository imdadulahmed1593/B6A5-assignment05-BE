import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

// Get all categories
const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { tutors: true },
      },
    },
  });

  return categories;
};

// Get category by ID
const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      tutors: {
        include: {
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
      },
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

// Create a new category (Admin only)
const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
}) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existingCategory) {
    throw new ApiError(400, "Category with this name already exists");
  }

  const category = await prisma.category.create({
    data,
  });

  return category;
};

// Update a category (Admin only)
const updateCategory = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
  },
) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (data.name && data.name !== category.name) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existingCategory) {
      throw new ApiError(400, "Category with this name already exists");
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data,
  });

  return updatedCategory;
};

// Delete a category (Admin only)
const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  await prisma.category.delete({
    where: { id },
  });

  return null;
};

export const CategoryService = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
