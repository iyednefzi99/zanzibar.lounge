type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
};

type Props = {
  item: MenuItem;
  locale: string;
  quantity: number;
  onAdd: () => void;
};

export function MenuItemCard({ item, quantity, onAdd }: Props) {
  function formatPrice(millimes: number): string {
    return `${(millimes / 1000).toFixed(3)} DT`;
  }

  return (
    <div className="flex items-start justify-between rounded-xl border border-shell/10 bg-deep/40 p-4 transition-colors hover:border-brass/30">
      <div className="flex-1">
        <p className="text-sm font-medium text-shell">{item.name}</p>
        {item.description && (
          <p className="mt-1 text-xs text-shell-dim line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="mt-2 font-mono text-sm text-brass">
          {formatPrice(item.price)}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="ml-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass text-brass transition-colors hover:bg-brass/10"
      >
        {quantity > 0 ? (
          <span className="font-mono text-xs">{quantity}</span>
        ) : (
          <span className="text-lg leading-none">+</span>
        )}
      </button>
    </div>
  );
}
