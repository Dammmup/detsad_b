import { hashPassword } from "./utils/hash";

(async () => {
  const hash = await hashPassword('Guzelya123');
  console.log(hash);
})();