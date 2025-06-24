export function getCurrencySymbol(code) {
  switch (code) {
    case "USD":
      return "$";
    case "CAD":
      return "C$";
    case "INR":
      return "₹";
    case "MXN":
      return "Mex$";
    default:
      return "";
  }
}

export const currencyOptions = [
  { label: "USD ($)", value: "USD" },
  { label: "CAD (C$)", value: "CAD" },
  { label: "INR (₹)", value: "INR" },
  { label: "MXN (Mex$)", value: "MXN" },
];

export function getFriendsDropdownOptions(friends, you) {
  return [
    { label: you, value: you },
    ...(friends || [])
      .filter((f) => f.name !== you)
      .map((f) => ({ label: f.name, value: f.name })),
  ];
}
