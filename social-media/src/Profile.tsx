import react, {useState, useEffect} from "react";
import { doc, getDocs, getDoc} from "firebase/firestore";
import { db } from "./firebase";

interface Props {
    currentUser: string;
}

export default function Profile({currentUser}: Props) {
    return (
        <h4>your username is {currentUser}</h4>
    )

}
