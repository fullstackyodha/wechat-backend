import cloudinary, { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export function uploads(
	file: string, // BASE64 ENCODED
	// OPTIONAL PARAMETERS
	public_id?: string,
	overwrite?: boolean,
	invalidate?: boolean
): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
	// Creates a new Promise.
	return new Promise((resolve) => {
		// Cloudinary Upload function
		cloudinary.v2.uploader.upload(
			file,
			{ public_id, overwrite, invalidate },
			// CALLBACK
			(
				err: UploadApiErrorResponse | undefined,
				result: UploadApiResponse | undefined
			) => {
				if (err) resolve(err);
				resolve(result);
			}
		);
	});
}

export function videoUpload(
	file: string,
	public_id?: string,
	overwrite?: boolean,
	invalidate?: boolean
): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
	return new Promise((resolve) => {
		cloudinary.v2.uploader.upload(
			file,
			{
				resource_type: 'video',
				chunk_size: 50000,
				public_id,
				overwrite,
				invalidate
			},
			(
				error: UploadApiErrorResponse | undefined,
				result: UploadApiResponse | undefined
			) => {
				if (error) resolve(error);
				resolve(result);
			}
		);
	});
}
