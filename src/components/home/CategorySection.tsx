import { Link } from "react-router-dom";
import { Shirt, Laptop, Home, Dumbbell } from "lucide-react";

const categories = [
  {
    name: "Fashion",
    slug: "fashion",
    icon: Shirt,
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: Laptop,
  },
  {
    name: "Home",
    slug: "home-living",
    icon: Home,
  },
  {
    name: "Sports",
    slug: "sports",
    icon: Dumbbell,
  },
];

export function CategorySection() {
  return (
    <section className="py-32">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-16">
          Categories
        </p>

        <div className="flex flex-wrap justify-center gap-16 md:gap-24">
          {categories.map((category) => (
            <Link 
              key={category.slug} 
              to={`/products?category=${category.slug}`}
              className="group flex flex-col items-center gap-4 opacity-60 hover:opacity-100 transition-all duration-700"
            >
              <div className="p-6 rounded-full bg-muted/20 group-hover:bg-muted/40 transition-all duration-700">
                <category.icon className="h-8 w-8 text-foreground/80" />
              </div>
              <span className="text-sm tracking-wide text-muted-foreground group-hover:text-foreground transition-colors duration-700">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
