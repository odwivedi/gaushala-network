import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024;  // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entity_type') as string || 'expert_contribution';
    const entityId = parseInt(formData.get('entity_id') as string || '0');

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const mimeType = file.type;
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isPdf = ALLOWED_PDF_TYPES.includes(mimeType);

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: 'Only images and PDFs are allowed' }, { status: 400 });
    }

    const fileSize = file.size;
    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
    }
    if (isPdf && fileSize > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'PDF must be under 10MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || (isImage ? 'jpg' : 'pdf');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const subDir = isImage ? 'images' : 'pdfs';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, fileName), buffer);

    const fileUrl = `/uploads/${subDir}/${fileName}`;
    const fileType = isImage ? 'image' : 'pdf';

    
    let attachmentId = null;

    if (entityId > 0) {
      const result = await pool.query(
        `INSERT INTO media_attachments (entity_type, entity_id, file_type, file_url, original_name, mime_type, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [entityType, entityId, fileType, fileUrl, file.name, mimeType, fileSize, user.id]
      );
      attachmentId = result.rows[0].id;
    }

    logger.info('UPLOAD', 'upload/route.ts', 'File uploaded', { fileUrl, fileType, uploadedBy: user.id });

    return NextResponse.json({ url: fileUrl, file_type: fileType, attachment_id: attachmentId });
  } catch (err) {
    logger.error('UPLOAD', 'upload/route.ts', 'Upload failed', { err: String(err) });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
