import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

interface GalleryProps {
  userId: string; // username
  onClose: () => void;
}

interface ImageData {
  id: string;
  imageName: string;
  imageData: string;
}

export default function Gallery({ userId, onClose }: GalleryProps) {
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [enlargedImage, setEnlargedImage] = useState<ImageData | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchImages();
  }, [userId]);

  const fetchImages = async () => {
    try {
      const imagesCol = collection(db, "users", userId, "images");
      const imagesSnap = await getDocs(imagesCol);

      const images = imagesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          imageName: data.imageName || "Unnamed",
          imageData: data.imageData || "",
        };
      });

      setGalleryImages(images);
    } catch (error) {
      console.error("❌ Failed to load gallery images:", error);
      setGalleryImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Delete this image? This cannot be undone.");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "users", userId, "images", id));
      setGalleryImages((prev) => prev.filter((img) => img.id !== id));
    } catch (error) {
      console.error("❌ Error deleting image:", error);
    }
  };

  return (
    <main className="main-screen">
      <h2>Gallery</h2>
      <button onClick={onClose}>Back</button>

      {loading ? (
        <p>Loading images...</p>
      ) : galleryImages.length === 0 ? (
        <p>No images yet.</p>
      ) : (
        <div
          className="gallery-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {galleryImages.map((img) => (
            <div
              key={img.id}
              style={{
                border: "2px solid black",
                borderRadius: "8px",
                padding: "5px",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img
                src={img.imageData}
                alt={img.imageName}
                style={{ maxWidth: "100%", borderRadius: "6px" }}
              />
              <p style={{ marginTop: "6px", fontWeight: "bold" }}>
                {img.imageName}
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button onClick={() => setEnlargedImage(img)}>🔍 Enlarge</button>
                <button onClick={() => handleDelete(img.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen image view */}
      {enlargedImage && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setEnlargedImage(null)}
        >
          <div
            style={{
              position: "relative",
              background: "#fff",
              padding: "20px",
              borderRadius: "12px",
              maxWidth: "90%",
              maxHeight: "90%",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={enlargedImage.imageData}
              alt={enlargedImage.imageName}
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <p style={{ textAlign: "center", marginTop: "10px" }}>
              {enlargedImage.imageName}
            </p>
            <button
              onClick={() => setEnlargedImage(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                fontSize: "1.2rem",
              }}
            >
              ❌
            </button>
          </div>
        </div>
      )}
    </main>
  );
}