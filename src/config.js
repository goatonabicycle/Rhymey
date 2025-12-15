export const config = {
  wordMinimumLength: 2,
  wordMaximumLength: 50,
  apiBaseUrl: "https://api.datamuse.com/words",
  cacheSize: 100,
  cacheExpiry: 24 * 60 * 60 * 1000,
  popup: {
    top: "20px",
    right: "20px",
    width: "400px",
    maxHeight: "80%",
  },
};

export const TAB_TITLES = [
  "Rhymes",
  "Near",
  "Similar",
  "Related",
  "Definition",
];
