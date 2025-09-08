### Minio Setp

1. Install Docker
2. Run command bellow to start your minio s3 storage

```shell
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=<username> \
  -e MINIO_ROOT_PASSWORD=<8 digit and above password> \
  minio/minio server /data --console-address ":9001"

```

3. When finished navigate to `http://localhost:9001` for web console where you could create backets, upload files,share, download e.t.c

4. Create instance alias using command (The creds must be similar to ones used above)

```shell
mc alias set <alias name e.g myminio> http://localhost:9000 <username> <password>

```

**NB**

- `mc` is a minio client
- `alias` - allows you to use a short name like myminio instead of the full endpoint.(`mc alias set myminio http://localhost:9000 minioadmin minioadmin
`)

5. For publicly acessible files, create a public bucket using web console or comand

```shell
mc mb myminio/private-bucket
mc mb myminio/public-bucket
```

6.By default all the minio buckets are private, to make a bucket public use command

```shell
mc anonymous set download myminio/public-bucket
```

You can now access public bucket files directly(only download permisions specified by set)

6. for private bucket, you must use pre-signed urls

### Presigned urls

MinIO pre-signed URLs are time-limited links that provide secure, temporary access to private objects in a MinIO bucket. They are a secure method for allowing clients to upload or download files directly without needing your MinIO access keys.

#### How pre-signed URLs work

A server-side application with proper credentials generates the URL for a specific object and a limited time frame. The process typically involves these steps:

- Application (backend) signs a URL with your MinIO access keys and sets an expiration time.
- The application passes the pre-signed URL to the client (e.g., a web browser).
- The client can then use the URL to perform the specified action, such as a PUT or GET request, before the URL expires.
  This process enables direct, secure transfers between the client and the MinIO server, offloading the transfer traffic from your backend application.

#### Example

```ts
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './s3Client';

const downloadObjectKey = 'my-private-document.pdf';
const uploadObjectKey = 'new-upload-image.jpg';

// Generate a pre-signed URL for downloading a private object
async function generateDownloadUrl() {
  const command = new GetObjectCommand({
    Bucket: 'private-bucket',
    Key: downloadObjectKey,
  });

  try {
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });
    console.log(`Generated Download URL: ${url}`);
    return url;
  } catch (err) {
    console.error('Error generating download URL:', err);
  }
}

// Generate a pre-signed URL for uploading a new object
async function generateUploadUrl() {
  const command = new PutObjectCommand({
    Bucket: 'private-bucket',
    Key: uploadObjectKey,
  });

  try {
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 600, // URL valid for 10 minutes
    });
    console.log(`Generated Upload URL: ${url}`);
    return url;
  } catch (err) {
    console.error('Error generating upload URL:', err);
  }
}

// Accessing a publicly readable object
function getPermanentUrl() {
  const endpoint = 'http://localhost:9000';
  const bucket = 'public-bucket';
  const objectKey = 'my-public-photo.png'; // Assuming this exists
  return `${endpoint}/${bucket}/${objectKey}`;
}
```
