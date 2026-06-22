/**
 * Google Drive API Client Helpers (Client-Side)
 * Integrates directly with Google Drive v3 endpoints using the user's OAuth access token.
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Searches for a folder by name, optionally under a parent folder.
 */
async function findFolder(token: string, name: string, parentId?: string): Promise<string | null> {
  let query = `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error finding folder:', errorData);
    throw new Error(errorData.error?.message || 'Error searching Google Drive folder');
  }

  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

/**
 * Creates a folder with the given name, optionally under a parent folder.
 */
async function createFolder(token: string, name: string, parentId?: string): Promise<string> {
  const url = 'https://www.googleapis.com/drive/v3/files';
  const body: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    body.parents = [parentId];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error creating folder:', errorData);
    throw new Error(errorData.error?.message || 'Error creating Google Drive folder');
  }

  const data = await res.json();
  return data.id;
}

/**
 * Finds a folder by name or creates it if it doesn't exist.
 */
export async function findOrCreateFolder(token: string, name: string, parentId?: string): Promise<string> {
  const existingId = await findFolder(token, name, parentId);
  if (existingId) return existingId;
  return await createFolder(token, name, parentId);
}

/**
 * Creates or updates a file in Google Drive.
 * First creates the metadata, then patches the clinical/database payload as media.
 */
export async function createOrUpdateFile(
  token: string,
  fileName: string,
  mimeType: string,
  content: string,
  parentFolderId?: string
): Promise<string> {
  // 1. Create file metadata model
  const urlMetadata = 'https://www.googleapis.com/drive/v3/files';
  const bodyMetadata: any = {
    name: fileName,
    mimeType: mimeType,
  };
  if (parentFolderId) {
    bodyMetadata.parents = [parentFolderId];
  }

  const resMeta = await fetch(urlMetadata, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyMetadata),
  });

  if (!resMeta.ok) {
    const errorData = await resMeta.json().catch(() => ({}));
    console.error('Error creating file metadata:', errorData);
    throw new Error(errorData.error?.message || 'Falha ao criar metadados do arquivo');
  }

  const metadata = await resMeta.json();
  const fileId = metadata.id;

  // 2. Upload file content media
  const urlContent = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  const resContent = await fetch(urlContent, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
    },
    body: content,
  });

  if (!resContent.ok) {
    const errorData = await resContent.json().catch(() => ({}));
    console.error('Error uploading file content:', errorData);
    // Cleanup metadata if content fails to prevent dummy files
    await deleteFile(token, fileId).catch(() => {});
    throw new Error(errorData.error?.message || 'Falha ao enviar conteúdo do arquivo');
  }

  return fileId;
}

/**
 * Lists files in a given folder.
 */
export async function listFilesInFolder(token: string, folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,size,webViewLink)`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error listing files:', errorData);
    throw new Error(errorData.error?.message || 'Erro ao listar arquivos do drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads a text/JSON file's raw content.
 */
export async function downloadFileContent(token: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error downloading file:', errorData);
    throw new Error(errorData.error?.message || 'Erro ao carregar o conteúdo do arquivo');
  }

  return await res.text();
}

/**
 * Deletes a file.
 */
export async function deleteFile(token: string, fileId: string): Promise<boolean> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error deleting file:', errorData);
    throw new Error(errorData.error?.message || 'Erro ao excluir o arquivo do drive');
  }

  return true;
}
