-- CreateTable
CREATE TABLE "news_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable (join table NewsItem <-> NewsTag)
CREATE TABLE "_NewsItemToNewsTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_slug_key" ON "news_categories"("slug");
CREATE INDEX "news_categories_order_idx" ON "news_categories"("order");

CREATE UNIQUE INDEX "news_tags_name_key" ON "news_tags"("name");

CREATE UNIQUE INDEX "_NewsItemToNewsTag_AB_unique" ON "_NewsItemToNewsTag"("A", "B");
CREATE INDEX "_NewsItemToNewsTag_B_index" ON "_NewsItemToNewsTag"("B");

-- AlterTable news_items: add categoryId
ALTER TABLE "news_items" ADD COLUMN "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "news_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_NewsItemToNewsTag" ADD CONSTRAINT "_NewsItemToNewsTag_A_fkey" FOREIGN KEY ("A") REFERENCES "news_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_NewsItemToNewsTag" ADD CONSTRAINT "_NewsItemToNewsTag_B_fkey" FOREIGN KEY ("B") REFERENCES "news_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex for category filter
CREATE INDEX "news_items_categoryId_idx" ON "news_items"("categoryId");
