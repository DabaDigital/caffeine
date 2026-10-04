import { products } from "@/data/menu";
import { ProductCard, MenuButton } from "@/components/menu/MenuProvider";
export function SignatureMenu() {
  return (
    <section
      id="menu"
      className="signatures section-space"
      aria-labelledby="menu-title"
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OUR SIGNATURES</p>
            <h2 id="menu-title">
              Coffee. Crêpes. <em>Good vibes.</em>
            </h2>
            <p className="body-copy">Crafted with passion, served with love.</p>
          </div>
          <MenuButton className="text-link">Discover the menu</MenuButton>
        </div>
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        <p className="menu-footnote">
          A taste of Caffeine. Discover the full selection in café.
        </p>
      </div>
    </section>
  );
}
