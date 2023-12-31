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
