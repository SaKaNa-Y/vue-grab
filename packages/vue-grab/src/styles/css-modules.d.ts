// Raw CSS imported as a string and injected into shadow roots.
declare module "*.css?raw" {
  const content: string;
  export default content;
}
