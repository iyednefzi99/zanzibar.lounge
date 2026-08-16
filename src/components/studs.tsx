/**
 * La rangée de clous de laiton.
 *
 * Ce n'est pas un ornement libre : c'est la citation des portes sculptées de
 * Stone Town, et c'est le seul séparateur du site. Partout où une section
 * s'achève, la porte se referme.
 */
export function Studs({
  className = "",
  reveal = false,
}: {
  className?: string;
  reveal?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`studs ${reveal ? "reveal" : ""} ${className}`}
    />
  );
}
