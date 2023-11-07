import { SignInButton, useUser } from "@clerk/nextjs";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const ctx = api.useUtils();

  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.")
      }
    }
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image src={user.imageUrl} alt="Profile image" className="w-14 h-14 rounded-full" width={56} height={56} />
      <input placeholder="Type some emojis!"
        className="bg-transparent grow outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
      />
      {input !== "" && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  )
};

type PostWithUser = RouterOutputs['post']['getAll'][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image src={author.imageUrl} alt="Profile image" className="w-14 h-14 rounded-full" width={56} height={56} />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{`- ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  )
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  )
}

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching asap and use cached data
  api.post.getAll.useQuery();

  // Return empty div if user isn't loaded yet
  if (!userLoaded) return <div />

  return (
    <>
      <main className="flex justify-center h-screen">
        <div className="w-full border-x border-slate-400 md:max-w-2xl">

          <div className="border-b border-slate-400 p-4">
            {!isSignedIn &&
              <div className="flex justify-center">
                <SignInButton />
              </div>}
            {isSignedIn && <CreatePostWizard />}
          </div>

          <Feed />
        </div>
      </main>
    </>
  );
}

export default Home;
