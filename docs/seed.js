/*
 * Sample data for the Supper Board demo. `day` is the offset from Monday of
 * the current week (0 = this Monday, 13 = Sunday next week), so the demo
 * always shows a plan that is "in progress". Ratings on future days are
 * dropped automatically.
 */
window.SUPPER_SEED = {
  plan: {
    guidelines: "Household of two. High protein, moderate calories. About 3 cook nights a week, each batched so leftovers cover the next night. Week 1 uses fresh proteins; week 2 uses proteins frozen on arrival.",
    status: "active"
  },
  meals: [
    { id: "m01", day: 0, kind: "cook", title: "Sheet-pan baked salmon", details: "With roasted broccoli and bell peppers. Cook extra for Tuesday.", rating: 5,
      recipe: { serves: "4 (2 tonight, 2 for tomorrow)", time: "35 min", oven: "425°F",
        ingredients: ["1.5 lb salmon fillets, cut into 4 pieces", "2 heads broccoli, cut into florets", "3 bell peppers, sliced into strips", "3 tbsp olive oil, divided", "1 tsp garlic powder", "1 tsp salt, divided", "½ tsp pepper", "1 lemon, cut into wedges"],
        steps: ["Heat the oven to 425°F. Line two sheet pans with foil or parchment.", "Toss the broccoli and peppers with 2 tbsp olive oil, ½ tsp salt, and the pepper. Spread them across both pans. Roast 10 minutes.", "Pat the salmon dry. Rub it with the remaining 1 tbsp oil, the garlic powder, and the remaining ½ tsp salt.", "Push the vegetables aside and lay the salmon skin-side down in the middle. Roast 12 to 15 minutes, until it flakes easily (145°F in the thickest part).", "Squeeze lemon over everything. Pack 2 portions for tomorrow within 2 hours."],
        tip: "Leftover salmon keeps 3 days. It's good cold over greens, or reheat gently at 50% power." } },
    { id: "m02", day: 1, kind: "leftovers", title: "Leftover salmon and veg", details: "Reheated, or cold over salad greens.", from: "m01" },
    { id: "m03", day: 2, kind: "cook", title: "Turkey taco bowls", details: "Ground turkey with cumin and chili powder, rice, cheddar, salsa.", rating: 4,
      recipe: { serves: "4 to 5", time: "30 min",
        ingredients: ["1.5 lb ground turkey", "1½ cups uncooked rice", "1 tbsp olive oil", "1 yellow onion, diced", "2 tsp chili powder", "1½ tsp cumin", "1 tsp garlic powder", "¾ tsp salt", "⅓ cup water", "1 cup shredded cheddar", "Salsa, for serving", "1 lime, cut into wedges"],
        steps: ["Start the rice according to the package directions.", "Heat the oil in a large skillet over medium-high heat. Cook the onion until soft, about 4 minutes.", "Add the turkey and break it up. Cook until no pink remains, about 7 minutes (165°F).", "Stir in the spices and salt; cook 1 minute. Add the water and simmer about 3 minutes.", "Build bowls: rice, turkey, cheddar, salsa, and a squeeze of lime."],
        tip: "Store the turkey and rice separately; add cheese and salsa after reheating." } },
    { id: "m04", day: 3, kind: "leftovers", title: "Leftover taco bowls", details: "", from: "m03" },
    { id: "m05", day: 4, kind: "cook", title: "Lemon-herb chicken breast", details: "With roasted zucchini and onions. Batch for the weekend.",
      recipe: { serves: "4 to 6", time: "40 min", oven: "425°F",
        ingredients: ["2 lb boneless chicken breast", "3 tbsp olive oil, divided", "1 lemon, zested and juiced", "2 garlic cloves, minced", "1 tsp Italian seasoning or dried oregano", "1 tsp salt, plus a pinch", "½ tsp pepper", "3 zucchini, cut into half-moons", "1 yellow onion, cut into wedges"],
        steps: ["Heat the oven to 425°F.", "If the breasts are thick, pound them to about ¾ inch so they cook evenly.", "Mix 2 tbsp oil with the lemon zest and juice, garlic, herbs, salt, and pepper. Coat the chicken.", "Toss the zucchini and onion with the remaining oil and a pinch of salt on a sheet pan. Roast 10 minutes.", "Add the chicken and roast 18 to 22 minutes, until it reaches 165°F.", "Rest the chicken 5 minutes before slicing."],
        tip: "Sliced leftover chicken keeps 3 to 4 days." } },
    { id: "m06", day: 5, kind: "leftovers", title: "Leftover lemon-herb chicken", details: "", from: "m05" },
    { id: "m07", day: 6, kind: "flex", title: "Frittata, omelets, or leftovers", details: "Flexible night.",
      recipe: { serves: "4", time: "25 min", oven: "400°F",
        ingredients: ["8 eggs", "¼ cup milk", "½ tsp salt", "¼ tsp pepper", "1 tbsp butter or olive oil", "1 cup chopped leftover vegetables", "½ cup shredded cheddar"],
        steps: ["Heat the oven to 400°F.", "Whisk the eggs, milk, salt, and pepper.", "Melt the butter in a 10-inch oven-safe nonstick skillet over medium heat. Warm the vegetables about 3 minutes.", "Pour in the eggs and stir gently for 1 minute. Add the cheese and cook undisturbed 2 to 3 minutes, until the edges set.", "Bake 10 to 12 minutes, until the center no longer jiggles."],
        tip: "Uses up leftover veg. Slices reheat well for breakfast." } },
    { id: "m08", day: 7, kind: "cook", title: "Chicken fajitas", details: "Thawed chicken breast with peppers and onions. Batch.", thaw: "the chicken breast (about 2 lb)",
      recipe: { serves: "4 to 5", time: "30 min",
        ingredients: ["2 lb chicken breast (thawed), sliced into strips", "3 bell peppers, sliced", "1 yellow onion, sliced", "3 tbsp olive oil, divided", "2 tsp chili powder", "1½ tsp cumin", "1 tsp garlic powder", "1 tsp salt", "2 limes", "To serve: rice or tortillas, salsa, cheddar"],
        steps: ["Toss the chicken with 1 tbsp oil, the spices, salt, and the juice of 1 lime.", "Cook the peppers and onion in 1 tbsp oil over high heat, 6 to 7 minutes. Move to a plate.", "Add the remaining oil and cook the chicken in a single layer, in batches, 5 to 6 minutes (165°F).", "Return the vegetables and squeeze the second lime over everything.", "Serve with rice or tortillas, salsa, and cheddar."],
        tip: "Crowding the pan steams the chicken instead of browning it." } },
    { id: "m09", day: 8, kind: "leftovers", title: "Leftover fajitas", details: "", from: "m08" },
    { id: "m10", day: 9, kind: "cook", title: "Turkey egg roll in a bowl", details: "Ground turkey, cabbage slaw mix, soy sauce, garlic.", thaw: "the ground turkey (about 1.5 lb)",
      recipe: { serves: "4", time: "20 min",
        ingredients: ["1.5 lb ground turkey (thawed)", "1 tbsp oil", "3 garlic cloves, minced", "1 bag (14 to 16 oz) cabbage slaw mix", "3 tbsp soy sauce, plus more to taste", "½ tsp pepper"],
        steps: ["Brown the turkey in the oil over medium-high heat, 6 to 7 minutes (165°F).", "Add the garlic and cook 1 minute.", "Add the slaw mix, soy sauce, and pepper. Stir-fry 4 to 5 minutes, until wilted but still crunchy.", "Taste and add more soy sauce if needed."],
        tip: "Pull it off the heat while the cabbage still has bite." } },
    { id: "m11", day: 10, kind: "leftovers", title: "Leftover egg roll bowls", details: "", from: "m10" },
    { id: "m12", day: 11, kind: "cook", title: "Shrimp stir-fry", details: "With whatever veg is left. Batch.", thaw: "the shrimp (1 lb bag)",
      recipe: { serves: "3", time: "25 min",
        ingredients: ["1 lb frozen shrimp, peeled, thawed", "4 cups mixed vegetables", "1½ tbsp oil, divided", "3 tbsp soy sauce", "1 tbsp water", "2 garlic cloves, minced", "Juice of ½ lime", "Cooked rice"],
        steps: ["Pat the thawed shrimp very dry.", "Whisk the soy sauce, water, garlic, and lime juice.", "Stir-fry the vegetables in 1 tbsp oil over high heat, 4 to 5 minutes. Move to a plate.", "Cook the shrimp in the remaining oil, 1 to 2 minutes per side, until pink.", "Return the vegetables, add the sauce, toss 1 minute. Serve over rice."],
        tip: "If the shrimp didn't thaw overnight, a sealed bag in cold water takes 15 to 20 minutes." } },
    { id: "m13", day: 12, kind: "flex", title: "Eggs, tuna salad, or leftovers", details: "" },
    { id: "m14", day: 13, kind: "flex", title: "Flexible night", details: "Last night of this plan." }
  ],
  notes: [
    { id: "n1", meal: "m03", text: "Add black beans next time" }
  ],
  grocery: [
    { id: "g1", text: "Coffee" },
    { id: "g2", text: "Paper towels" }
  ],
  ideas: [
    { id: "i1", text: "More fish next plan" }
  ],
  staples: [
    { id: "p01", name: "Olive oil", group: "Pantry", status: "have", order: 1 },
    { id: "p02", name: "Rice", group: "Pantry", status: "have", order: 2 },
    { id: "p03", name: "Soy sauce", group: "Pantry", status: "low", order: 3 },
    { id: "p04", name: "Cumin", group: "Pantry", status: "have", order: 4 },
    { id: "p05", name: "Chili powder", group: "Pantry", status: "unknown", order: 5 },
    { id: "s01", name: "Eggs", group: "Snacks and dairy", status: "have", order: 11 },
    { id: "s02", name: "Milk", group: "Snacks and dairy", status: "have", order: 12 },
    { id: "s03", name: "Greek yogurt", group: "Snacks and dairy", status: "have", order: 13 },
    { id: "s04", name: "Hummus", group: "Snacks and dairy", status: "unknown", order: 14 }
  ],
  freezer: [
    { id: "f1", name: "Chicken breast, about 2 lb", forMeal: "Week 2 fajitas" },
    { id: "f2", name: "Ground turkey, about 1.5 lb", forMeal: "Week 2 egg roll bowls" },
    { id: "f3", name: "Frozen shrimp, 1 lb bag", forMeal: "Week 2 stir-fry" }
  ]
};
