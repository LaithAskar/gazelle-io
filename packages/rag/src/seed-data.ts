// A small, curated set of real Common Core standards (public domain) spanning
// K-6 across Math and ELA. Used to seed the RAG knowledge base without Apify.
// grade: 0 = Kindergarten. subject: "math" | "ela".

export interface SeedStandard {
  code: string;
  grade: number;
  subject: "math" | "ela";
  description: string;
}

export const SEED_SOURCE = "common_core";

export const SEED_STANDARDS: SeedStandard[] = [
  // ---- Kindergarten ----
  { code: "CCSS.MATH.CONTENT.K.CC.A.1", grade: 0, subject: "math", description: "Count to 100 by ones and by tens." },
  { code: "CCSS.MATH.CONTENT.K.CC.B.4", grade: 0, subject: "math", description: "Understand the relationship between numbers and quantities; connect counting to cardinality." },
  { code: "CCSS.ELA-LITERACY.RF.K.1", grade: 0, subject: "ela", description: "Demonstrate understanding of the organization and basic features of print, including recognizing that words are separated by spaces." },

  // ---- Grade 1 ----
  { code: "CCSS.MATH.CONTENT.1.OA.A.1", grade: 1, subject: "math", description: "Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, putting together, taking apart, and comparing." },
  { code: "CCSS.MATH.CONTENT.1.NBT.B.2", grade: 1, subject: "math", description: "Understand that the two digits of a two-digit number represent amounts of tens and ones." },
  { code: "CCSS.ELA-LITERACY.RL.1.1", grade: 1, subject: "ela", description: "Ask and answer questions about key details in a text." },

  // ---- Grade 2 ----
  { code: "CCSS.MATH.CONTENT.2.NBT.A.1", grade: 2, subject: "math", description: "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones." },
  { code: "CCSS.MATH.CONTENT.2.OA.A.1", grade: 2, subject: "math", description: "Use addition and subtraction within 100 to solve one- and two-step word problems involving situations of adding to, taking from, putting together, taking apart, and comparing." },
  { code: "CCSS.ELA-LITERACY.RF.2.4", grade: 2, subject: "ela", description: "Read with sufficient accuracy and fluency to support comprehension." },

  // ---- Grade 3 ----
  { code: "CCSS.MATH.CONTENT.3.OA.A.1", grade: 3, subject: "math", description: "Interpret products of whole numbers, e.g., interpret 5 x 7 as the total number of objects in 5 groups of 7 objects each." },
  { code: "CCSS.MATH.CONTENT.3.OA.A.3", grade: 3, subject: "math", description: "Use multiplication and division within 100 to solve word problems in situations involving equal groups, arrays, and measurement quantities." },
  { code: "CCSS.MATH.CONTENT.3.NF.A.1", grade: 3, subject: "math", description: "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts; understand a fraction a/b as the quantity formed by a parts of size 1/b." },
  { code: "CCSS.ELA-LITERACY.RL.3.1", grade: 3, subject: "ela", description: "Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for the answers." },

  // ---- Grade 4 ----
  { code: "CCSS.MATH.CONTENT.4.NF.A.1", grade: 4, subject: "math", description: "Explain why a fraction a/b is equivalent to a fraction (n x a)/(n x b) by using visual fraction models, with attention to how the number and size of the parts differ." },
  { code: "CCSS.MATH.CONTENT.4.OA.A.3", grade: 4, subject: "math", description: "Solve multistep word problems posed with whole numbers and having whole-number answers using the four operations, including problems in which remainders must be interpreted." },
  { code: "CCSS.ELA-LITERACY.RL.4.1", grade: 4, subject: "ela", description: "Refer to details and examples in a text when explaining what the text says explicitly and when drawing inferences from the text." },

  // ---- Grade 5 ----
  { code: "CCSS.MATH.CONTENT.5.NBT.B.5", grade: 5, subject: "math", description: "Fluently multiply multi-digit whole numbers using the standard algorithm." },
  { code: "CCSS.MATH.CONTENT.5.NF.A.1", grade: 5, subject: "math", description: "Add and subtract fractions with unlike denominators (including mixed numbers) by replacing given fractions with equivalent fractions to produce a common denominator." },
  { code: "CCSS.ELA-LITERACY.RL.5.1", grade: 5, subject: "ela", description: "Quote accurately from a text when explaining what the text says explicitly and when drawing inferences from the text." },

  // ---- Grade 6 ----
  { code: "CCSS.MATH.CONTENT.6.RP.A.1", grade: 6, subject: "math", description: "Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities." },
  { code: "CCSS.MATH.CONTENT.6.EE.A.1", grade: 6, subject: "math", description: "Write and evaluate numerical expressions involving whole-number exponents." },
  { code: "CCSS.ELA-LITERACY.RL.6.1", grade: 6, subject: "ela", description: "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text." },
];
