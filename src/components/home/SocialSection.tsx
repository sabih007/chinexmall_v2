import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Container, Section, SectionHeading } from "@/components/ui/Primitives";
import { getSocialPosts } from "@/lib/repository";
import { socials } from "@/lib/site";

/** Social wall (spec §39). */
export async function SocialSection() {
  const posts = await getSocialPosts();
  const instagram = socials.find((s) => s.label === "Instagram");

  return (
    <Section tone="sand">
      <Container>
        <SectionHeading
          eyebrow={instagram?.handle ?? "Follow"}
          title="Follow the finds"
          subtitle="Home setups, new landings and what customers are doing with their orders."
          action={
            <a
              href={instagram?.href ?? "#"}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[12.5px] font-medium transition-colors hover:border-brand hover:text-brand"
            >
              Follow us
              <ArrowUpRight
                size={14}
                strokeWidth={1.8}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          }
        />

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {posts.map((post, i) => (
            <li key={post.caption} className="group relative">
              <a
                href={instagram?.href ?? "#"}
                target="_blank"
                rel="noreferrer noopener"
                className="block"
              >
                <div className="relative aspect-square overflow-hidden rounded-card bg-sand-deep">
                  <Image
                    src={post.image}
                    alt={post.caption}
                    fill
                    loading={i < 4 ? undefined : "lazy"}
                    sizes="(min-width:640px) 24vw, 48vw"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-brand/0 transition-colors duration-500 group-hover:bg-brand/25" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
