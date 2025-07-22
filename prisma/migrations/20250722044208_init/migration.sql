-- CreateEnum
CREATE TYPE "roles" AS ENUM ('Admin', 'User');

-- CreateEnum
CREATE TYPE "permissions" AS ENUM ('ManageLibraries', 'ManageBooks', 'ManageLoans', 'ManageScans', 'ManageJobs', 'ManageUsers', 'DownloadBooks', 'ViewReports');

-- CreateEnum
CREATE TYPE "library_item_type" AS ENUM ('Audiobook', 'Ebook', 'Magazine');

-- CreateEnum
CREATE TYPE "loan_file_status" AS ENUM ('Skipped', 'Pending', 'Processing', 'Downloaded', 'Failed');

-- CreateEnum
CREATE TYPE "scan_status" AS ENUM ('Success', 'InProgress', 'Failed', 'Cancelled');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('Pending', 'InProgress', 'Completed', 'Failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "preferences" JSONB,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "role" "roles" NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "permission" "permissions" NOT NULL,
    "role" "roles" NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libraries" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "pin" TEXT,
    "library_selector" TEXT,
    "preferences" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "returned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "publisher" TEXT,
    "release_date" TIMESTAMP(3),
    "subjects" TEXT[],
    "language" TEXT,
    "overdrive_id" TEXT NOT NULL,
    "type" "library_item_type" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "authors" TEXT[],
    "chapters" JSONB,
    "series" TEXT[],
    "seriesIndex" TEXT,
    "isbn" TEXT,
    "library_item_id" TEXT NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audiobooks" (
    "id" TEXT NOT NULL,
    "narrators" TEXT[],
    "duration" INTEGER NOT NULL,
    "book_id" TEXT NOT NULL,

    CONSTRAINT "audiobooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebooks" (
    "id" TEXT NOT NULL,
    "page_count" INTEGER,
    "book_id" TEXT NOT NULL,

    CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazines" (
    "id" TEXT NOT NULL,
    "issue" TEXT,
    "library_item_id" TEXT NOT NULL,

    CONSTRAINT "magazines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_files" (
    "id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "duration" INTEGER,
    "status" "loan_file_status" NOT NULL DEFAULT 'Processing',
    "loan_id" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_type" TEXT,
    "file_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "loan_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_history" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "scan_status" NOT NULL,
    "library_id" TEXT NOT NULL,
    "scan_data" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'Pending',
    "user_id" TEXT,
    "payload" JSONB,
    "priority" INTEGER NOT NULL,
    "libraryId" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LibraryToLibraryItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LibraryToLibraryItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_role_key" ON "user_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");

-- CreateIndex
CREATE INDEX "idx_library_hostname" ON "libraries"("hostname");

-- CreateIndex
CREATE INDEX "idx_library_user_id" ON "libraries"("user_id");

-- CreateIndex
CREATE INDEX "idx_loan_book_id" ON "loans"("book_id");

-- CreateIndex
CREATE INDEX "idx_loan_library_id" ON "loans"("library_id");

-- CreateIndex
CREATE INDEX "idx_loan_user_id" ON "loans"("user_id");

-- CreateIndex
CREATE INDEX "idx_library_item_title" ON "library_items"("title");

-- CreateIndex
CREATE INDEX "idx_library_item_type" ON "library_items"("type");

-- CreateIndex
CREATE INDEX "idx_library_item_overdrive_id" ON "library_items"("overdrive_id");

-- CreateIndex
CREATE UNIQUE INDEX "books_library_item_id_key" ON "books"("library_item_id");

-- CreateIndex
CREATE INDEX "idx_book_library_item_id" ON "books"("library_item_id");

-- CreateIndex
CREATE INDEX "idx_book_isbn" ON "books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "audiobooks_book_id_key" ON "audiobooks"("book_id");

-- CreateIndex
CREATE INDEX "idx_audiobook_book_id" ON "audiobooks"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "ebooks_book_id_key" ON "ebooks"("book_id");

-- CreateIndex
CREATE INDEX "idx_ebook_book_id" ON "ebooks"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "magazines_library_item_id_key" ON "magazines"("library_item_id");

-- CreateIndex
CREATE INDEX "idx_magazine_library_item_id" ON "magazines"("library_item_id");

-- CreateIndex
CREATE INDEX "idx_loan_file_loan_id" ON "loan_files"("loan_id");

-- CreateIndex
CREATE INDEX "idx_loan_file_file_path" ON "loan_files"("file_path");

-- CreateIndex
CREATE INDEX "idx_scan_history_library_id" ON "scan_history"("library_id");

-- CreateIndex
CREATE INDEX "idx_scan_history_timestamp" ON "scan_history"("timestamp");

-- CreateIndex
CREATE INDEX "idx_job_user_id" ON "jobs"("user_id");

-- CreateIndex
CREATE INDEX "idx_job_library_id" ON "jobs"("libraryId");

-- CreateIndex
CREATE INDEX "idx_job_type" ON "jobs"("type");

-- CreateIndex
CREATE INDEX "_LibraryToLibraryItem_B_index" ON "_LibraryToLibraryItem"("B");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_fkey" FOREIGN KEY ("role") REFERENCES "user_roles"("role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "libraries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiobooks" ADD CONSTRAINT "audiobooks_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebooks" ADD CONSTRAINT "ebooks_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazines" ADD CONSTRAINT "magazines_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_files" ADD CONSTRAINT "loan_files_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_history" ADD CONSTRAINT "scan_history_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "libraries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToLibraryItem" ADD CONSTRAINT "_LibraryToLibraryItem_A_fkey" FOREIGN KEY ("A") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToLibraryItem" ADD CONSTRAINT "_LibraryToLibraryItem_B_fkey" FOREIGN KEY ("B") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
