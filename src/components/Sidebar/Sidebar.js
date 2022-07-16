import React, { useCallback, useEffect, useState } from "react";
import "components/Sidebar/Sidebar.scss";
import auth from "hoc/auth";
import logo from "public/assets/arc_logo_full.svg";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import trashIcon from "public/assets/trash.svg";

export default function Sidebar({ documentsArray, sharedDocumentsArray }) {
  const navigate = useNavigate();
  const logout = useCallback(() => {
    auth.logout(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("ownerEmail");
      navigate("/");
    });
  }, [navigate]);
  const [documents, setDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const accessToken = localStorage.accessToken;
  if (accessToken === "" || accessToken === null || accessToken === undefined) {
    navigate("/error");
  }

  useEffect(() => {
    setDocuments(documentsArray);
    setSharedDocuments(sharedDocumentsArray);
  }, [documentsArray, sharedDocumentsArray]);

  const deleteDocument = useCallback(
    async (documentId) => {
      let message = "Are you sure you want to delete the document?";
      if (window.confirm(message) === true) {
        try {
          let config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          };
          let res = await axios.delete(
            `${process.env.REACT_APP_SERVER_LINK}/documents/${documentId}`,
            {},
            config
          );
          if (res.status === "200") {
            console.log("success");
          }
        } catch (err) {
          console.log(err.message);
        }
      }
    },
    [accessToken]
  );

  const documentOptions = documents.map((item, key) => {
    var url = document.URL;
    var documentId = url.substring(url.lastIndexOf("/") + 1);
    return (
      <div className="sidebar__menu--container" key={key}>
        <Link
          className={
            item.id === documentId
              ? "sidebar__menu--options sidebar__menu--options-active"
              : "sidebar__menu--options"
          }
          to={`/documents/${item.id}`}
        >
          <div>
            {item.name == null || item.name === ""
              ? `Document ${key + 1}`
              : item.name}
          </div>
        </Link>
        <img
          src={trashIcon}
          alt="trash"
          className="sidebar__menu--options-delete"
          onClick={() => deleteDocument(item.id)}
        />
      </div>
    );
  });

  const sharedDocumentOptions = sharedDocuments.map((item, key) => {
    var url = document.URL;
    var documentId = url.substring(url.lastIndexOf("/") + 1);
    return (
      <div className="sidebar__menu--container" key={key}>
        <Link
          className={
            item.id === documentId
              ? "sidebar__menu--options sidebar__menu--options-active"
              : "sidebar__menu--options"
          }
          key={key}
          to={`/documents/${item.id}`}
        >
          {item.name == null || item.name === ""
            ? `Shared Document ${key + 1}`
            : item.name}
        </Link>
      </div>
    );
  });

  const renderDocuments = useCallback(() => {
    return <div>{documentOptions}</div>;
  }, [documentOptions]);

  const renderSharedDocuments = useCallback(() => {
    return <div>{sharedDocumentOptions}</div>;
  }, [sharedDocumentOptions]);

  const newDocBtnOnClick = useCallback(async () => {
    try {
      var config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      };
      var res = await axios.post(
        `${process.env.REACT_APP_SERVER_LINK}/documents`,
        {},
        config
      );
      var parsedData = JSON.parse(res.data);
      var id = parsedData["id"];
      setDocuments([...documents, { id: id, name: parsedData["name"] }]);
      navigate(`/documents/${id}`);
      return res.data;
    } catch (err) {
      navigate("/error");
    }
  }, [documents, navigate, accessToken]);

  return (
    <div className="sidebar">
      <Link to="/documents" className="sidebar__logo">
        <img src={logo} alt="logo" className="sidebar__logo--icon" />
      </Link>
      <div
        className="sidebar__menu"
        style={
          documents.length + sharedDocuments.length > 10
            ? { overflowY: "scroll" }
            : null
        }
      >
        {sharedDocumentsArray.length !== 0 ? (
          <>
            <div className="sidebar__menu--headers">
              <p className="sidebar__menu--headers--title">Shared Documents:</p>
            </div>
            {sharedDocuments.length === 0 ? (
              <CircularProgress size={40} color="secondary" />
            ) : (
              renderSharedDocuments()
            )}
          </>
        ) : null}
        <div className="sidebar__menu--headers">
          <p className="sidebar__menu--headers--title">Documents:</p>
          <button
            className="sidebar__menu--headers--btn"
            onClick={newDocBtnOnClick}
          >
            +
          </button>
        </div>
        {documents.length === 0 ? (
          <CircularProgress size={40} color="secondary" />
        ) : (
          renderDocuments()
        )}
      </div>
      <button className="sidebar__btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
