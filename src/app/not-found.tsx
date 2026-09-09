import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";

export default function NotFound() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow text-muted">404</p>
        <h1 className="display mt-4 text-[2rem] sm:text-[2.6rem]">
          This page has
          <br />
          sold out.
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
          The link may be old, or the product may have moved. The rest of the
          store is still very much open.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" size="lg">
            Shop all
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
