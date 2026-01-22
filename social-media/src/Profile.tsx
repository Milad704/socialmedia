import React, { useState, useEffect } from "react";
import { doc, getDocs, getDoc, collection, setDoc } from "firebase/firestore";
import { db } from "./firebase";

//interface to use/pass properties
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
  // different react states, use set ones to change it
  const [text, Settext] = useState("");
  const [addBio, SetaddBio] = useState(false);
  const [bio, setBio] = useState<string | null>(null);
  const [postedImages, setPostedImages] = useState<PostedImage[]>([]);

  const saveBio = async () => {
    if (!text.trim()) return;
    //saves the written bio at this pathway
    await setDoc(doc(db, "users", currentUser, "bio", "info"), {
      text: text,
      updatedAt: new Date(),
    });

    SetaddBio(false);
  };
  const ShowBio = async () => {
    //get bio from that pathway
    const biotext_snap = await getDoc(
      doc(db, "users", currentUser, "bio", "info")
    );
    //get data inside of it and turn it into text, then show it
    const biotext_data = biotext_snap.data();
    const biotext = biotext_data?.text;
    setBio(biotext);
  };
  // useffect excutes when profile runs first time or shows up(when currentuser changes)
  useEffect(() => {
    const loadPostedImages = async () => {
      const image_snap = await getDocs(
        collection(db, "users", currentUser, "posted")
      );
      setPostedImages(
        // map loops through docs and transform into new with what we want
        image_snap.docs.map((doc) => ({
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
      <button onClick={onClose}>Back</button>
      <button onClick={() => SetaddBio(true)}>Add/Change bio</button>
      <div className="profile_top">
        <img
          src={currentImg}
          alt="Profile"
          className="profile_pic"
        />

        <button className="bio_button" onClick={ShowBio}>show Bio</button>
        {/* if bio is true, will show the bio */}
        {bio && (
          <div className="bio_show">
           <p className="bio_text">{bio}</p> 
          </div>
        )}
        {bio && (
          <button className="bio_button" onClick={() => setBio(null)}>Hide</button>
        )}
      </div>
        {/* if button to add bio is clicked, text input box will show up */}
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
      <h1>Your Images</h1>
      <div className="posted-images">
        {postedImages.map((img) => (
          
          <div key={img.id}>
            <h5>{img.imageName}</h5>
            <img
              src={img.imageData}
              alt={img.imageName}
              style={{ width: "200px", height: "150px" }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
