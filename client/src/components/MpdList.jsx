import React, { useState, useEffect } from "react";
import axios from "axios";
import './MpdList.css';

export default function MpdList() {
  const [data, setData] = useState([]);

  const handleCopyMpd = (mpd) => {
    navigator.clipboard.writeText(mpd);
    alert("MPD URL copied!");
  };

  useEffect(() => {
    axios
      .get("http://localhost:8000/mpds")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  if (data.length === 0) {
    return <p>No MPDs found</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Video</th>
          <th colSpan={2}>MPD</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={row.idx + 1}>
            <td>{row.video}</td>
            <td>{row.mpd}</td>
            <td>
              <button onClick={() => handleCopyMpd(row.mpd)}>Copy MPD</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
