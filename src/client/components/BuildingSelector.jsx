import { memo } from "react";

function BuildingSelector({ buildings = [], value = "all", onChange, singleLabel = "Сграда" }) {
  const hasSingle = buildings.length === 1 && buildings[0];

  if (hasSingle) {
    return (
      <div className="building-badge">
        <p className="building-label">{singleLabel}: </p>
        <p className="building-info">
          {buildings[0].name} - {buildings[0].address}
        </p>
      </div>
    );
  }

  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)}>
      <option value="all">Всички сгради</option>
      {buildings.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} - {b.address}
        </option>
      ))}
    </select>
  );
}

export default memo(BuildingSelector);

