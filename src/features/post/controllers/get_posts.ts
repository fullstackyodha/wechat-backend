import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@service/redis/post.cache';
import { postService } from '@service/db/post.service';

const postCache: PostCache = new PostCache();
const PAGE_SIZE = 10; // posts per page

export class Get {
	public async posts(req: Request, res: Response): Promise<void> {
		const { page } = req.params; // Page Number
		const skip: number = (+page - 1) * PAGE_SIZE; // page1:skip = 0, page2:skip = 10,...
		const limit: number = PAGE_SIZE * +page; // page1:limit = 10 , page2:limit = 20

		// for redis cache
		const newSkip: number = skip === 0 ? skip : skip + 1;

		let posts: IPostDocument[] = [];
		let totalPosts = 0;

		const cachedPosts: IPostDocument[] = await postCache.getPostsFromCache(
			'posts',
			newSkip,
			limit
		);

		if (cachedPosts.length) {
			posts = cachedPosts;
			totalPosts = await postCache.getTotalPostsInCache();
		} else {
			posts = await postService.getPostFromDB({}, skip, limit, { createdAt: -1 });
			totalPosts = await postService.postCount();
		}

		res.status(HTTP_STATUS.OK).json({ message: 'All Posts', posts, totalPosts });
	}

	public async postsWithImages(req: Request, res: Response): Promise<void> {
		const { page } = req.params;
		const skip: number = (+page - 1) * PAGE_SIZE;
		const limit: number = PAGE_SIZE * +page;

		// for redis cache
		const newSkip: number = skip === 0 ? skip : skip + 1;
		let posts: IPostDocument[] = [];

		const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache(
			'post',
			newSkip,
			limit
		);

		posts = cachedPosts.length
			? cachedPosts
			: await postService.getPostFromDB({ imgId: '$ne', gifUrl: '$ne' }, skip, limit, {
					createdAt: -1
				});

		res.status(HTTP_STATUS.OK).json({
			message: 'All Posts with Images',
			posts
		});
	}

	public async postsWithVideos(req: Request, res: Response): Promise<void> {
		const { page } = req.params;

		const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
		const limit: number = PAGE_SIZE * parseInt(page);
		const newSkip: number = skip === 0 ? skip : skip + 1;

		let posts: IPostDocument[] = [];
		const cachedVideoPosts: IPostDocument[] =
			await postCache.getPostsWithVideosFromCache('posts', newSkip, limit);

		posts = cachedVideoPosts.length
			? cachedVideoPosts
			: await postService.getPostFromDB({ videoId: '$ne' }, skip, limit, {
					createdAt: -1
				});

		res.status(HTTP_STATUS.OK).json({ message: 'All posts with videos', posts });
	}
}
