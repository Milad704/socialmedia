import react, {useState, useEffect} from "react";
import { doc, getDocs, getDoc} from "firebase/firestore";
import { db } from "./firebase";

interface Props {
    currentUser: string;
    currentImg: string;
    
}
const [text, Settext] = useState("");

export default function Profile({currentUser, currentImg}: Props) {
    return (
        <><h4>your username is {currentUser}</h4>
        <img src={currentImg} alt="Profile" style={{ width: "120px", height: "120px" }}/>  
        </>
    )

}
