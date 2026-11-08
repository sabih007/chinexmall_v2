import { ArrowRight } from "lucide-react";
import { StoreImage as Image } from "@/components/common/StoreImage";
import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { getShopCategories } from "@/lib/navigation";
import { CategorySlider } from "./CategorySlider";

export async function CategoryGrid() {
  const categories = await getShopCategories();
  if (!categories.length) return null;
  return (
    <Section id="categories" className="scroll-mt-40 py-10 md:py-14">
      <Container>
        <SectionHeading title="Shop by category" subtitle="Find your way to the things you need." action={<Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-brand">Shop all products<ArrowRight size={16} /></Link>} />
        <CategorySlider>
          {categories.map((category) => (
            <li key={category.id} className="w-full shrink-0 snap-start sm:w-[29%] lg:w-[21%] xl:w-[17%]">
              <Link href={category.href} className="group flex h-full flex-col overflow-hidden rounded-tile border border-line bg-sand transition-shadow hover:shadow-card-hover">
                <div className="relative aspect-[4/3] overflow-hidden bg-paper">
                  <Image src={category.image} alt="" fill sizes="(min-width:1280px) 15vw, (min-width:1024px) 22vw, (min-width:640px) 30vw, 90vw" className="object-cover object-center transition-transform duration-300 motion-safe:group-hover:scale-105" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-2 p-4">
                  <div><h3 className="text-sm font-semibold group-hover:text-brand">{category.label}</h3><p className="mt-1 text-xs text-ink-soft">{category.count} {category.count === 1 ? "product" : "products"}</p></div>
                  <ArrowRight size={16} className="shrink-0 text-brand" />
                </div>
              </Link>
            </li>
          ))}
        </CategorySlider>
      </Container>
    </Section>
  );
}
