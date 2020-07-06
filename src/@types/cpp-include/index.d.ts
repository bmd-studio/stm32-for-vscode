declare module 'cpp-include' {
  export function getIncludeFilesFromString(inputString: string): { path: string; local: string; find: string; origin: string }[];
}