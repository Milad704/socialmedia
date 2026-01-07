import react, {useState, useEffect} from "react";
import { doc, getDocs, getDoc, collection, setDoc} from "firebase/firestore";
import { db } from "./firebase";

interface Props {
    currentUser: string;
    currentImg: string;
    
}


export default function Profile({currentUser, currentImg}: Props) {
    const [text, Settext] = useState("");
    const [addBio, SetaddBio] = useState(false)

    const saveBio = async () => {
        if (!text.trim()) return;
      
        await setDoc(
          doc(db, "users", currentUser, "bio", "info"),
          {
            text: text,
            updatedAt: new Date(),
          }
        );
      
        SetaddBio(false);
      };
        
    return (

        <><h4>your username is {currentUser}</h4>
        <img src={currentImg} alt="Profile" style={{ width: "120px", height: "120px" }}/>  

        <button onClick={() => SetaddBio(true)}>Add/Change bio</button>

        {addBio && (
            <div className="bio_input"><input type="text"placeholder ="type your bio" value={text}onChange={(e) => Settext(e.target.value)}></input>
            <button onClick={saveBio}>Done</button>
            </div>
            
        )}

        </>
    )

}
