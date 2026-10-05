# Set up your own Supper Board

This guide walks through building your own copy. I'm not a developer, and I built all of this by talking to Claude, so the steps below are mostly things to ask Claude.

## What you need

- **A Claude account** with artifacts and scheduled tasks. Everyone who uses the board needs a Claude account to sign in. Features vary by plan and change over time, so check [support.claude.com](https://support.claude.com) for what yours includes.
- **Google Drive connected to Claude.** This is optional. It's only used to hand the weekly list to a shopping agent.
- **A shopping agent or a store app.** I use Meta's Muse for Walmart pickup. You can also paste the list into any store's app by hand.
- **A tablet for the kitchen.** Optional. See [kitchen-tablet.md](kitchen-tablet.md).

## 1. Publish the board

Download [`board/supper-board.html`](../board/supper-board.html), attach it to a Claude chat, and ask:

> Publish this file as an artifact exactly as it is, with the `db` capability so it has a shared database. Don't change the design.

Claude will give you a private link. That link is your board.

The page is written as a Claude artifact. It uses `window.claude.use("db")` for its shared, live database, so it won't save anything if you host it somewhere else. The [demo](../docs/) works outside Claude only because it swaps in a fake database.

## 2. Load your first plan

Give Claude your current meal plan. Paste it, attach a PDF, or describe it. Then ask:

> Load this plan into my Supper Board. Use the data model in guides/data-model.md. Write a recipe for each cook night, mark which week-2 meals need thawing, and fill in my staples and freezer.

Point Claude at [data-model.md](data-model.md) so it writes the fields the page expects.

## 3. Share it with your household

On the board, tap **Share** and invite each person by email as an **Editor**. Leave public link sharing off. A public link makes everyone view-only, and they couldn't rate meals or add groceries.

On each phone, open the link in the browser, sign in to Claude, and choose **Add to Home Screen**.

## 4. Turn on the weekly automation

Ask Claude to create two scheduled tasks using the prompts in [`automation/`](../automation/):

1. [Tuesday plan draft](../automation/1-plan-draft-task.md): writes the next two weeks for you to review.
2. [Thursday grocery list](../automation/2-grocery-list-task.md): finalizes the plan and builds the order list.

Fill in the `[brackets]` first: your board link, time zone, food guidelines, and Drive folder. When Claude creates the tasks, check that they're set to approve automatically. A run that waits for approval will stall with nobody there to click.

## 5. Hand the list to your store

Follow [3-grocery-agent-handoff.md](../automation/3-grocery-agent-handoff.md) to set up a shopping agent, or just use the board's **Copy list** button and paste into your store's app.

## Customizing

- **Store and agent names:** the board's text mentions Walmart and Muse in a few places, like "Copy list for Muse." Ask Claude to change these to your store and agent.
- **Look:** the board uses a warm diner palette and is locked to light mode. Ask Claude to restyle it, or mock up options in Claude Design first.
- **Rhythm:** three cook nights a week with leftovers the next night is the default. Change it in your plan guidelines and in the Tuesday prompt.
