-- 1. Enable UUID extension if needed (good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
CREATE TYPE "Role" AS ENUM ('admin', 'user');
CREATE TYPE "EquipmentStatus" AS ENUM ('active', 'inactive', 'maintenance', 'retired');
CREATE TYPE "Frequency" AS ENUM ('weekly', 'monthly', '3-monthly', 'yearly', '5-yearly');
CREATE TYPE "Criticality" AS ENUM ('low', 'medium', 'high');

-- 3. Create Users Table
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 4. Create Equipment Categories Table
CREATE TABLE "equipment_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- 5. Create Equipment Table
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- 6. Create Jobs Table
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "jobCode" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobType" TEXT,
    "equipmentId" INTEGER NOT NULL,
    "category" TEXT,
    "flag" TEXT,
    "dateDone" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plannedHours" DOUBLE PRECISION NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "dateDue" TIMESTAMP(3) NOT NULL,
    "remainingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criticality" "Criticality" NOT NULL,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- 7. Create Maintenance History Table
CREATE TABLE "maintenance_history" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "jobId" INTEGER,
    "description" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_history_pkey" PRIMARY KEY ("id")
);

-- 8. Create Indexes and Uniques
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "equipment_categories_name_key" ON "equipment_categories"("name");
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");
CREATE UNIQUE INDEX "jobs_jobCode_key" ON "jobs"("jobCode");

-- 9. Add Foreign Keys
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "equipment_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 10. SEED DATA (Categories)
INSERT INTO "equipment_categories" ("name", "description") VALUES
('Material Handling Equipment', 'Cranes, Forklifts, etc.'),
('Measurement Equipment', 'Calipers, Micrometers, Gauges'),
('Safety Equipment', 'Extinguishers, Harnesses, Kits'),
('PPE and Personal Equipment', 'Helmets, Gloves, Boots')
ON CONFLICT ("name") DO NOTHING;

-- 11. SEED DATA (Admin User - Password is 'admin123' hashed)
INSERT INTO "users" ("username", "password", "role", "email", "updatedAt") VALUES
('admin', '$2a$10$w2nqmx7hfVixNnvvrrtVWec3M0QkEkxb8exSgOape8bSLu2wBdhCq', 'admin', 'admin@krsteel.com', CURRENT_TIMESTAMP)
ON CONFLICT ("username") DO NOTHING;
