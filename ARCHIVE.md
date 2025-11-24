# Archive System

This portfolio supports archiving projects and blog posts without deleting them. Archived items are hidden from all public pages but remain in the repository.

## How to Archive

To archive a project or blog post, add `archived: true` to the frontmatter:

### Projects

```markdown
---
title: "Project Title"
year: "2024"
description: "Project description"
tags: ["Tag1", "Tag2"]
metric_value: "Value"
metric_label: "Label"
featured: false
order: 0
archived: true  # <-- Add this line
---
```

### Blog Posts

```markdown
---
title: "Blog Post Title"
date: 2024-12-15
description: "Post description"
tags: ["Tag1", "Tag2"]
readingTime: "5 min read"
archived: true  # <-- Add this line
---
```

## What Happens When Archived

- ✅ Item is hidden from homepage (if featured)
- ✅ Item is hidden from project/blog listing pages
- ✅ Item is hidden from pagination
- ✅ Direct URL access returns 404 (page not generated)
- ✅ File remains in repository (not deleted)
- ✅ Can be unarchived by removing `archived: true` or setting `archived: false`

## Unarchiving

Simply remove the `archived: true` line or set `archived: false` in the frontmatter.

## Default Behavior

If `archived` is not specified, it defaults to `false` (item is visible).

