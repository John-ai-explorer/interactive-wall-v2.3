import Link from "next/link";
import { getAllStories } from "@/lib/stories";

export default function HomePage() {
  const stories = getAllStories();

  return (
    <div className="min-h-[100dvh] overflow-hidden">
      <section className="relative min-h-[100dvh] px-6 pb-16 pt-24 md:px-10 lg:px-14">
        <img
          src="/assets/ui/v2/pc_entry_bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-48"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,14,26,0.95),rgba(8,14,26,0.62)_52%,rgba(8,14,26,0.86))]" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-10rem)] max-w-[92rem] gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center xl:gap-14">
          <div>
            <p className="mb-5 text-base font-medium text-[#D6A84F]">
              数智赋能红色文化传播 V2.0
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-tight text-[#F7F2E8] md:text-7xl xl:text-8xl">
              科学家精神文化长廊数字化扫描与交互平台
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-9 text-[#D9D0C1] xl:text-xl xl:leading-10">
              以文化墙拍照识别为入口，进入同一故事沉浸页，完成三维漫游、时序故事、声景讲述、节点问答和精神印记生成。
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/scan"
                className="btn-primary inline-flex min-h-14 items-center justify-center rounded-xl px-8 text-lg font-semibold"
              >
                墙面智扫
              </Link>
              <Link
                href="/experience/qian-xuesen"
                className="btn-outline inline-flex min-h-14 items-center justify-center rounded-xl px-8 text-lg font-semibold"
              >
                直接演示
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:gap-8">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/experience/${story.id}`}
                className="group overflow-hidden rounded-2xl border border-[rgba(214,168,79,0.18)] bg-[rgba(8,14,26,0.68)] transition-transform duration-300 hover:-translate-y-1"
              >
                <img
                  src={story.hero.poster}
                  alt={story.title}
                  className="aspect-[16/10] w-full object-cover opacity-82 transition-opacity group-hover:opacity-100"
                />
                <div className="p-5 xl:p-6">
                  <p className="text-sm text-[#D6A84F]">{story.subtitle}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[#F7F2E8] xl:text-3xl">
                    {story.title}
                  </h2>
                  <p className="mt-3 line-clamp-4 text-base leading-7 text-[#B9B1A2]">
                    {story.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {story.spiritKeywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-[#E8D7A4]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(214,168,79,0.12)] px-5 py-8">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-3 text-base text-[#B9B1A2] md:flex-row md:items-center md:justify-between">
          <p>延伸学习仅作为附属入口，核心体验集中在故事沉浸页。</p>
          <div className="flex gap-3">
            <Link href="/qa" className="text-[#D6A84F] hover:text-[#F7F2E8]">
              科学家精神知识问答
            </Link>
            <Link href="/news" className="text-[#D6A84F] hover:text-[#F7F2E8]">
              新闻速递
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
