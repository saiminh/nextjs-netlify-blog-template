import { GetStaticProps, GetStaticPaths } from "next";
// import renderToString from "next-mdx-remote/render-to-string";
import { serialize } from 'next-mdx-remote/serialize'
// import { MdxRemote } from "next-mdx-remote/dist/types";
// import hydrate from "next-mdx-remote/hydrate";
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import matter from "gray-matter";
import { fetchPostContent } from "../../lib/posts";
import fs from "fs";
import yaml from "js-yaml";
import { parseISO } from 'date-fns';
import PostLayout from "../../components/PostLayout";

import showdown from "showdown";

import InstagramEmbed from "react-instagram-embed";
import YouTube from "react-youtube";
import { TwitterTweetEmbed } from "react-twitter-embed";

export type Props = {
  title: string;
  dateString: string;
  slug: string;
  tags: string[];
  description?: string;
  ingredients?: string;
  instructions?: string;
  source: MDXRemoteSerializeResult;
};

const components = {  };
const slugToPostContent = (postContents => {
  let hash = {}
  postContents.forEach(it => hash[it.slug] = it)
  return hash;
})(fetchPostContent());

export default function Post({
  title,
  dateString,
  slug,
  tags,
  description = "",
  ingredients = "",
  instructions = "",
  source,
}: Props) {
  // const content = hydrate(source, { components })
  return (
    
    <PostLayout
      title={title}
      date={parseISO(dateString)}
      slug={slug}
      tags={tags}
      description={description}
      ingredients={ingredients}
      instructions={instructions}
    >
      <MDXRemote {...source} components={components} />
    </PostLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = fetchPostContent().map(it => "/posts/" + it.slug);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params.post as string;
  const source = fs.readFileSync(slugToPostContent[slug].fullPath, "utf8");
  const { content, data } = matter(source, {
    engines: { yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) as object }
  });
  // const mdxSource = await renderToString(content, { components, scope: data });
  const mdxSource = await serialize(content);
  // const mdxIngredients = data.ingredients ? data.ingredients : "";
  // const mdxInstructions = data.instructions ? await serialize(data.instructions) : '';
  // showdown.setOption('simpleLineBreaks', 'true');
  const converter = new showdown.Converter(),
        ingredientsText      = data.ingredients ? data.ingredients : "",
        mdxIngredientsHtml   = converter.makeHtml(ingredientsText),
        instructionsText      = data.instructions ? data.instructions.replace(/\n/gi, '\n\n') : "",
        mdxInstructionsHtml   = converter.makeHtml(instructionsText);
  const postSlug = data.slug ? data.slug : params.post as string;
  const postTags = data.tags ? data.tags : [];

  return {
    props: {
      title: data.title,
      dateString: data.date,
      slug: postSlug,
      description: "",
      ingredients: mdxIngredientsHtml,
      instructions: mdxInstructionsHtml,
      tags: postTags,
      source: mdxSource
    },
  };
};

