# Step 3: handing the list to a shopping agent

Walmart has no public API for placing customer orders, so something has to drive the store's site or app. There are two ways to do this:

| Approach | How it works | Tradeoffs |
|---|---|---|
| **Shopping agent (what I use)** | An assistant that can shop Walmart for you picks up the list Claude saved and builds the order. I use Meta's Muse. | Runs in the agent's own cloud browser, so nothing needs to be on at home. You approve the order in the agent's app. |
| **Claude browsing your Chrome** | A scheduled task drives your signed-in Chrome through the Claude in Chrome extension and stops before checkout. | Your computer must be on, awake, and running Chrome at the scheduled time. More moving parts. |

I started with the Chrome approach and switched to the agent handoff because it doesn't depend on a computer at home.

## Message for the shopping agent

Paste this into your agent once and adjust the `[brackets]`. If the agent supports recurring tasks, it runs on its own each week. If it doesn't, the **Copy list** button on the board gives you the same list to paste by hand.

```text
Hi [AGENT NAME], I'm changing how we handle groceries.

Meal planning, recipes, and dates are now handled by Claude through a shared board. You don't need to plan meals, write recipes, or choose cook nights anymore. If you have a recurring task for meal planning, please turn it off.

Your new job is just the [STORE] order:

Set up a recurring task for every Thursday at 7:00 PM [TIME ZONE]:
1. Look in my Google Drive folder called "Supper Board" for the newest Google Doc titled "Grocery order – Sun [date]".
2. Only continue if that doc was created today and its date is this coming Sunday. If there's no new doc this week, do nothing. We sometimes push our plan back, so some weeks won't have an order.
3. Build a [STORE] pickup order with exactly the items and quantities in the doc. Use my usual pickup store, and pick a Sunday afternoon pickup time, ideally between 1 and 4 PM.
4. [SUBSTITUTION RULES]
5. Don't place the order yet. Send me a summary first: estimated total, pickup time, any substitutions, and anything you couldn't find. Place it once I approve.

Please don't add, remove, or change items beyond necessary substitutions. If something on the list seems off, ask me.

If I paste a grocery list into this chat that starts with "Please build a [STORE] order", handle it the same way.
```

## Tips

- The agent needs access to the same Google account as the Drive folder. A quick check is to ask it, "Can you see a folder called Supper Board in my Google Drive?"
- Keep the "send me a summary first" step, at least at the beginning. Odd substitutions are easy to catch there.
- Claude saves the list at about 5:50 PM and the agent runs at 7:00 PM, which leaves a buffer.
