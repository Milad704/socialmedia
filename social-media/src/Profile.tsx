import react, { useState, useEffect } from "react";
import {
  doc,
  getDocs,
  getDoc,
  collection,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

interface Props {
  onClose(): void;
  currentUser: string;
  currentImg: string;
  image: PostedImage[];
}
interface PostedImage {
  id: string;
  imageName: string;
  imageData: string;
}

export default function Profile({ onClose, currentUser, currentImg }: Props) {
  const [text, Settext] = useState("");
  const [addBio, SetaddBio] = useState(false);
  const [bio, setBio] = useState<string | null>(null);
  const [postedImages, setPostedImages] = useState<PostedImage[]>([]);

  const saveBio = async () => {
    if (!text.trim()) return;

    await setDoc(doc(db, "users", currentUser, "bio", "info"), {
      text: text,
      updatedAt: new Date(),
    });

    SetaddBio(false);
  };
  // if their is bio saved in db, set the text inside db into setBio state(showing it)
  const ShowBio = async () => {
    const biotext_snap = await getDoc(
      doc(db, "users", currentUser, "bio", "info")
    );
    const biotext_data = biotext_snap.data();
    const biotext = biotext_data?.text;
    setBio(biotext);
  };
  useEffect(() => {
    const loadPostedImages = async () => {
      const snap = await getDocs(
        collection(db, "users", currentUser, "posted")
      );

      setPostedImages(
        snap.docs.map((doc) => ({
          id: doc.id,
          imageName: doc.data().imageName,
          imageData: doc.data().imageData,
        }))
      );
    };

    loadPostedImages();
  }, [currentUser]);

  return (
    <>
      <h4>your username is {currentUser}</h4>
      <img
        src={currentImg}
        alt="Profile"
        style={{ width: "120px", height: "120px" }}
      />
      <button onClick={onClose}>Back</button>
      <div className="bio_show"> <button onClick={() => ShowBio()}>show Bio</button></div>
      <button onClick={() => SetaddBio(true)}>Add/Change bio</button>


      <div className="posted-images">
        {postedImages.map((img) => (
          <div key={img.id} style={{ margin: "10px" }}>
            <h5>{img.imageName}</h5>
            <img
              src={img.imageData}
              alt={img.imageName}
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
          </div>
        ))}
      </div>

      {addBio && (
        <div className="bio_input">
          <textarea
            placeholder="type your bio"
            value={text}
            onChange={(e) => Settext(e.target.value)}
          ></textarea>
          <button onClick={saveBio}>Done</button>
        </div>
      )}
      {bio && (
        <div className="bio_show">
          {bio}
          <button onClick={() => setBio(null)}>Hide</button>
        </div>
      )}
    </>
  );
}
