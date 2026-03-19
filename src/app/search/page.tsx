import { SearchView } from "@/components/search-view"
import { getPublishedPosts } from "@/lib/posts"

export const metadata = {
  title: "Search",
}

export default async function SearchPage() {
  const posts = await getPublishedPosts()
  return <SearchView initialQuery="" posts={posts} />
}
