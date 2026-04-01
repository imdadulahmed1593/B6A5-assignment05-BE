import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, BookingStatus } from "../generated/prisma/client";
import { auth } from "../src/lib/auth";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper to create user via Better Auth API
async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<{ id: string; email: string } | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`  User ${userData.email} already exists, skipping...`);
      return { id: existingUser.id, email: existingUser.email };
    }

    // Use Better Auth's API to sign up user
    const response = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      },
    });

    if (response.user) {
      // Update role and verify email directly in DB
      await prisma.user.update({
        where: { id: response.user.id },
        data: {
          role: userData.role,
          emailVerified: true,
          status: "ACTIVE",
        },
      });

      return { id: response.user.id, email: response.user.email };
    }

    return null;
  } catch (error: any) {
    console.error(`  Failed to create user ${userData.email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // ==================== Categories ====================
  const categories = [
    {
      name: "Mathematics",
      description: "Algebra, Calculus, Statistics, and more",
      icon: "📐",
    },
    {
      name: "Programming",
      description: "Web development, Data Science, Mobile apps",
      icon: "💻",
    },
    {
      name: "Languages",
      description: "English, Spanish, French, and more",
      icon: "🌍",
    },
    { name: "Science", description: "Physics, Chemistry, Biology", icon: "🔬" },
    { name: "Music", description: "Piano, Guitar, Vocal training", icon: "🎵" },
    {
      name: "Business",
      description: "Marketing, Finance, Entrepreneurship",
      icon: "📈",
    },
    {
      name: "Art & Design",
      description: "Drawing, Painting, Graphic Design",
      icon: "🎨",
    },
    {
      name: "Health & Fitness",
      description: "Yoga, Personal Training, Nutrition",
      icon: "💪",
    },
  ];

  const createdCategories: { id: string; name: string }[] = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    createdCategories.push({ id: created.id, name: created.name });
  }
  console.log("✅ Categories created:", createdCategories.length);

  // ==================== Create Admin ====================
  console.log("\n📝 Creating admin user...");
  const admin = await createUser({
    email: "admin@skillbridge.com",
    password: "admin123",
    name: "Admin User",
    role: "ADMIN",
  });
  if (admin) {
    console.log("✅ Admin user created:", admin.email);
  }

  // ==================== Create Students ====================
  console.log("\n📝 Creating student users...");
  const students = [
    { name: "Alice Johnson", email: "alice@example.com" },
    { name: "Bob Williams", email: "bob@example.com" },
    { name: "Carol Davis", email: "carol@example.com" },
    { name: "David Brown", email: "david@example.com" },
    { name: "Emma Wilson", email: "emma@example.com" },
  ];

  const createdStudents: { id: string; email: string }[] = [];
  for (const student of students) {
    const created = await createUser({
      email: student.email,
      password: "student123",
      name: student.name,
      role: "STUDENT",
    });
    if (created) {
      createdStudents.push(created);
    }
  }
  console.log("✅ Students created:", createdStudents.length);

  // ==================== Create Tutors ====================
  console.log("\n📝 Creating tutor users...");
  const tutors = [
    {
      name: "Dr. John Smith",
      email: "john.tutor@example.com",
      bio: "PhD in Mathematics with 10+ years of teaching experience. Specialized in calculus and linear algebra.",
      hourlyRate: 60,
      experience: 10,
      rating: 4.9,
      totalReviews: 45,
      categories: ["Mathematics", "Science"],
    },
    {
      name: "Sarah Chen",
      email: "sarah.tutor@example.com",
      bio: "Full-stack developer and coding bootcamp instructor. Expert in React, Node.js, and Python.",
      hourlyRate: 75,
      experience: 7,
      rating: 4.8,
      totalReviews: 62,
      categories: ["Programming"],
    },
    {
      name: "Michael Torres",
      email: "michael.tutor@example.com",
      bio: "Native Spanish speaker with TESOL certification. Teaching English and Spanish for 8 years.",
      hourlyRate: 45,
      experience: 8,
      rating: 4.7,
      totalReviews: 38,
      categories: ["Languages"],
    },
    {
      name: "Emily Parker",
      email: "emily.tutor@example.com",
      bio: "Professional pianist and music theory teacher. Graduate of Juilliard School of Music.",
      hourlyRate: 55,
      experience: 12,
      rating: 5.0,
      totalReviews: 28,
      categories: ["Music"],
    },
    {
      name: "James Wilson",
      email: "james.tutor@example.com",
      bio: "MBA from Harvard Business School. Former consultant at McKinsey. Teaching business strategy and finance.",
      hourlyRate: 90,
      experience: 15,
      rating: 4.6,
      totalReviews: 33,
      categories: ["Business"],
    },
    {
      name: "Lisa Anderson",
      email: "lisa.tutor@example.com",
      bio: "Professional graphic designer with expertise in Adobe Suite. Teaching design principles for 6 years.",
      hourlyRate: 50,
      experience: 6,
      rating: 4.8,
      totalReviews: 41,
      categories: ["Art & Design", "Programming"],
    },
    {
      name: "Dr. Robert Kim",
      email: "robert.tutor@example.com",
      bio: "Research scientist specializing in Physics and Chemistry. Making complex concepts simple and fun.",
      hourlyRate: 65,
      experience: 9,
      rating: 4.7,
      totalReviews: 29,
      categories: ["Science", "Mathematics"],
    },
    {
      name: "Amanda Foster",
      email: "amanda.tutor@example.com",
      bio: "Certified personal trainer and nutritionist. Helping people achieve their health goals.",
      hourlyRate: 40,
      experience: 5,
      rating: 4.9,
      totalReviews: 52,
      categories: ["Health & Fitness"],
    },
  ];

  const createdTutorProfiles: { id: string; userId: string }[] = [];
  for (const tutor of tutors) {
    const created = await createUser({
      email: tutor.email,
      password: "tutor123",
      name: tutor.name,
      role: "TUTOR",
    });

    if (created) {
      // Find category IDs
      const categoryIds = createdCategories
        .filter((c) => tutor.categories.includes(c.name))
        .map((c) => c.id);

      // Create tutor profile
      const tutorProfile = await prisma.tutorProfile.upsert({
        where: { userId: created.id },
        update: {},
        create: {
          userId: created.id,
          bio: tutor.bio,
          hourlyRate: tutor.hourlyRate,
          experience: tutor.experience,
          rating: tutor.rating,
          totalReviews: tutor.totalReviews,
          isAvailable: true,
          categories: {
            create: categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
          availabilities: {
            create: [
              { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
              { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
              { dayOfWeek: 2, startTime: "09:00", endTime: "12:00" },
              { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" },
              { dayOfWeek: 3, startTime: "09:00", endTime: "12:00" },
              { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
              { dayOfWeek: 4, startTime: "09:00", endTime: "12:00" },
              { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" },
              { dayOfWeek: 5, startTime: "09:00", endTime: "12:00" },
              { dayOfWeek: 5, startTime: "14:00", endTime: "17:00" },
            ],
          },
        },
      });

      createdTutorProfiles.push({
        id: tutorProfile.id,
        userId: created.id,
      });
    }
  }
  console.log("✅ Tutors with profiles created:", createdTutorProfiles.length);

  // ==================== Bookings ====================
  console.log("\n📝 Creating bookings...");
  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
  });
  const allTutorProfiles = await prisma.tutorProfile.findMany();

  if (allStudents.length > 0 && allTutorProfiles.length > 0) {
    const bookings: {
      studentId: string;
      tutorProfileId: string;
      scheduledAt: Date;
      duration: number;
      status: BookingStatus;
      notes: string;
    }[] = [];

    const now = new Date();

    // Past completed bookings (for reviews)
    for (
      let i = 0;
      i < Math.min(allStudents.length, allTutorProfiles.length);
      i++
    ) {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - (i + 1) * 7);
      pastDate.setHours(10 + i, 0, 0, 0);

      bookings.push({
        studentId: allStudents[i].id,
        tutorProfileId: allTutorProfiles[i].id,
        scheduledAt: pastDate,
        duration: 60,
        status: BookingStatus.COMPLETED,
        notes: `Completed session ${i + 1}`,
      });
    }

    // Upcoming confirmed bookings
    for (let i = 0; i < 3; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + (i + 1) * 3);
      futureDate.setHours(14 + i, 0, 0, 0);

      bookings.push({
        studentId: allStudents[i % allStudents.length].id,
        tutorProfileId: allTutorProfiles[(i + 2) % allTutorProfiles.length].id,
        scheduledAt: futureDate,
        duration: 60,
        status: BookingStatus.CONFIRMED,
        notes: `Upcoming session - Topic: Introduction`,
      });
    }

    // Pending bookings
    for (let i = 0; i < 2; i++) {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 10 + i);
      futureDate.setHours(11, 0, 0, 0);

      bookings.push({
        studentId: allStudents[(i + 1) % allStudents.length].id,
        tutorProfileId: allTutorProfiles[(i + 3) % allTutorProfiles.length].id,
        scheduledAt: futureDate,
        duration: 90,
        status: BookingStatus.PENDING,
        notes: `Pending approval`,
      });
    }

    const createdBookings: {
      id: string;
      studentId: string;
      tutorProfileId: string;
      status: BookingStatus;
    }[] = [];
    for (const booking of bookings) {
      const created = await prisma.booking.create({
        data: booking,
      });
      createdBookings.push({
        id: created.id,
        studentId: created.studentId,
        tutorProfileId: created.tutorProfileId,
        status: created.status,
      });
    }
    console.log("✅ Bookings created:", createdBookings.length);

    // ==================== Reviews ====================
    console.log("\n📝 Creating reviews...");
    const reviewComments = [
      "Excellent tutor! Very patient and explains concepts clearly.",
      "Great session, learned a lot. Highly recommended!",
      "Very knowledgeable and professional. Will book again.",
      "Amazing teaching style. Made complex topics easy to understand.",
      "Fantastic experience! The tutor was well-prepared and engaging.",
    ];

    const completedBookings = createdBookings.filter(
      (b) => b.status === BookingStatus.COMPLETED,
    );

    let reviewCount = 0;
    for (let i = 0; i < completedBookings.length; i++) {
      const booking = completedBookings[i];
      await prisma.review.create({
        data: {
          rating: 4 + Math.floor(Math.random() * 2),
          comment: reviewComments[i % reviewComments.length],
          studentId: booking.studentId,
          tutorProfileId: booking.tutorProfileId,
          bookingId: booking.id,
        },
      });
      reviewCount++;
    }
    console.log("✅ Reviews created:", reviewCount);
  }

  // ==================== Summary ====================
  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📧 Login Credentials:");
  console.log("   Admin:   admin@skillbridge.com / admin123");
  console.log("   Student: alice@example.com / student123");
  console.log("   Tutor:   john.tutor@example.com / tutor123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
