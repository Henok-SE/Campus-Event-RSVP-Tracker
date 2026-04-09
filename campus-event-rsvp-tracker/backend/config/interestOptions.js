const FIXED_INTEREST_CATEGORIES = [
  "Academic",
  "Sports",
  "Arts",
  "Social",
  "Tech",
  "Free Food",
  "Wellness"
];

const FIXED_INTEREST_CATEGORY_LOOKUP = new Map(
  FIXED_INTEREST_CATEGORIES.map((category) => [category.toLowerCase(), category])
);

module.exports = {
  FIXED_INTEREST_CATEGORIES,
  FIXED_INTEREST_CATEGORY_LOOKUP
};