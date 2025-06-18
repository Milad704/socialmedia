import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

interface GalleryProps {
  userId: string; // username
  onClose: () => void;
  setSelectedImageUrl: Dispatch<SetStateAction<string | null>>;
  setSelectedImageName: Dispatch<SetStateAction<string | null>>;
}

interface ImageData {
  id: string;
  imageName: string;
  imageData: string; // This is expected to be a base64 or URL string of the image
}

export default function Gallery({
  userId,
  onClose,
  setSelectedImageUrl,
  setSelectedImageName,
}: GalleryProps) {
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [enlargedImage, setEnlargedImage] = useState<ImageData | null>(null);

  // Fetch images from Firestore when userId changes
  useEffect(() => {
    if (!userId) return;
    fetchImages();
  }, [userId]);

  // Fetch all images in the subcollection "users/{userId}/images"
  const fetchImages = async () => {
    try {
      const imagesCol = collection(db, "users", userId, "images");
      const imagesSnap = await getDocs(imagesCol);

      // Map documents to ImageData array
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

  // Delete image document from Firestore
  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Delete this image? This cannot be undone.");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "users", userId, "images", id));
      // Remove from local state after deletion
      setGalleryImages((prev) => prev.filter((img) => img.id !== id));
    } catch (error) {
      console.error("❌ Error deleting image:", error);
    }
  };

  // This function is supposed to save the selected image as the profile picture
  const handleSetProfile = async (img: ImageData) => {
    try {
      // This writes the profile image data inside "users/{userId}/profile/image"
      // Note: This is a document in a subcollection "profile" under the user
      const profileDocRef = doc(db, "users", userId, "profile", "image");
      await setDoc(profileDocRef, {
        imageName: img.imageName,
        imageData: img.imageData,
        updatedAt: new Date().toISOString(),
      });

      // Immediately update selected image in parent component (App.tsx)
      setSelectedImageUrl(img.imageData);
      setSelectedImageName(img.imageName);

      alert("✅ Set as profile picture!");
    } catch (error) {
      console.error("❌ Failed to set profile picture:", error);
      alert("Failed to set profile picture.");
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "6px",
                }}
              >
                <button onClick={() => setEnlargedImage(img)}>🔍 Enlarge</button>
                <button onClick={() => handleDelete(img.id)}>🗑️ Delete</button>
                <button onClick={() => handleSetProfile(img)}>
                  👤 Set as Profile
                </button>
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
