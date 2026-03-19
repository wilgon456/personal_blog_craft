import { SearchView } from "@/components/search-view"
import { getPublishedPosts } from "@/lib/posts"
import { absoluteUrl, siteDescription } from "@/lib/site"

export const metadata = {
  title: "Search",
  description: `Search posts and notes across ${siteDescription}`,
  alternates: {
    canonical: absoluteUrl("search/"),
  },
}

export default async function SearchPage() {
  const posts = await getPublishedPosts()
  return <SearchView initialQuery="" posts={posts} />
}
