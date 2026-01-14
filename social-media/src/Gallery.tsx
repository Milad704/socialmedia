import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

interface GalleryProps {
  userId: string;
  onClose(): void;                                    // callback to exit gallery
  setSelectedImageUrl: Dispatch<SetStateAction<string | null>>;   // update parent’s profile URL
  setSelectedImageName: Dispatch<SetStateAction<string | null>>;  // update parent’s profile name
}

interface ImageData { id: string; imageName: string; imageData: string; }

export default function Gallery({
  userId, onClose, setSelectedImageUrl, setSelectedImageName,
}: GalleryProps) {
  const [images, setImages] = useState<ImageData[]>([]);    // gallery images
  const [loading, setLoading] = useState(true);              // loading flag
  const [enlarged, setEnlarged] = useState<ImageData | null>(null); // for fullscreen view
  const [isPosted, setisPosted] = useState<{ [imageId: string]: boolean }>({});

  // ─── Fetch all images whenever userId changes ─────────────────────────
  useEffect(() => {
    (async () => {
      if (!userId) {
        return setLoading(false);
      }
      try {
        const imageSnap = await getDocs(collection(db, "users", userId, "images"));
        setImages(
          imageSnap.docs.map(document => ({
            id: document.id,
            imageName: document.data().imageName || "Not Named",
            imageData: document.data().imageData || "",
          }))
        );
      } catch (e) {
        console.error(" Failed to load gallery images:", e);
        setImages([]);
      } finally {
        setLoading(false);
      }
      const postedSnap = await getDocs(collection(db, "users", userId, "posted"))

      const postedMap: { [imageId: string]: boolean } = {};
      postedSnap.forEach(doc => { postedMap[doc.id] = true})


    }) ()
  }, [userId]);
  const unpostImage = async (img: ImageData) => {
    await deleteDoc(doc(db,"users", userId, "posted", img.id))
     setisPosted(prev => ({ ...prev, [img.id]: false })); // image id doesnt exist, so its false(will show post)
  }
  const postImage = async (img: ImageData) => {
    await setDoc(
      doc(db, "users", userId, "posted", img.id),
      {
        imageName: img.imageName,
        imageData: img.imageData,
        postedAt: new Date().toISOString(),
      }
    );
    setisPosted(prev => ({ ...prev, [img.id]: true })); // image id does exist, so its true(will show unpost)
  };
  
  // ─── Styles extracted to constants to keep JSX clean ────────────────
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))",
    gap: "10px",
  } as const;

  const itemStyle = {
    border: "2px solid black",
    borderRadius: "8px",
    padding: "5px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  } as const;

  const btnGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "6px",
  } as const;

  const modalOverlay = {
    position: "fixed" as const,
    top: 0, left: 0, width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 9999,
  };

  const modalContent = {
    position: "relative" as const,
    background: "#fff", padding: "20px", borderRadius: "12px",
    maxWidth: "90%", maxHeight: "90%", overflow: "auto",
  };

  return (
    <main className="main-screen">
      <h2>Gallery</h2>
      <button onClick={onClose}>Back</button>
      {/* loading / empty / grid states */}
      {loading
        ? <p>Loading images...</p>
        : images.length === 0
          ? <p>No images yet.</p>
          : (
            <div className="gallery-grid" style={gridStyle}>
              {images.map(img => (
                <div key={img.id} style={itemStyle}>
                  {/* thumbnail */}
                  <img
                    src={img.imageData}
                    alt={img.imageName}
                    style={{ maxWidth: "100%", borderRadius: "6px" }}
                  />

                  {/* image label */}
                  <p style={{ marginTop: "6px", fontWeight: "bold" }}>
                    {img.imageName}
                  </p>

                  {/* action buttons */}
                  <div style={btnGroupStyle}>
                    {isPosted[img.id] ? (
                      <button onClick={() => unpostImage(img)}>UnPost</button>
                    ): <button onClick={() => postImage(img)}>Post</button>}
                    {/* enlarge to fullscreen */}
                    <button onClick={() => setEnlarged(img)}> Enlarge</button>

                    {/* delete from Firestore & state */}
                    <button onClick={async () => {
                      if (!window.confirm("Delete this image?")) return;
                      await deleteDoc(doc(db, "users", userId, "images", img.id));
                      setImages(prev => prev.filter(i => i.id !== img.id));
                    }}>
                      Delete Image
                    </button>

                    {/* set as profile picture in Firestore & parent */}
                    <button onClick={async () => {
                      try {
                        await setDoc(doc(db, "users", userId, "profile", "image"), {
                          imageName: img.imageName,
                          imageData: img.imageData,
                          updatedAt: new Date().toISOString(),
                        });
                        setSelectedImageUrl(img.imageData);
                        setSelectedImageName(img.imageName);
                        alert("✅ Set as profile picture!");
                      } catch {
                        alert("❌ Failed to set profile picture.");
                      }
                    }}>
                      Set as Profile Picture
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* fullscreen modal */}
      {enlarged && (
        <div className="modal-overlay" style={modalOverlay} onClick={() => setEnlarged(null)}>
          <div style={modalContent} onClick={click_event => click_event.stopPropagation()}>
            <img
              src={enlarged.imageData}
              alt={enlarged.imageName}
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <p style={{ textAlign: "center", marginTop: "10px" }}>
              {enlarged.imageName}
            </p>
            <button
              onClick={() => setEnlarged(null)}
              style={{ position: "absolute", top: "10px", right: "10px", fontSize: "1.2rem" }}
            >
              ❌
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
