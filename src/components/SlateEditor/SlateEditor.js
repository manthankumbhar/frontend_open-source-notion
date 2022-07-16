import React, {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "components/SlateEditor/SlateEditor.scss";
import {
  createEditor,
  Editor,
  Transforms,
  Element as SlateElement,
} from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import Menu, { Item as MenuItem } from "rc-menu";
import "rc-menu/assets/index.css";
import axios from "axios";
import { useNavigate } from "react-router";
import { CircularProgress, FormControlLabel, Switch } from "@mui/material";
import { withHistory } from "slate-history";
import isHotkey from "is-hotkey";
import SnackBar from "components/SnackBar/SnackBar";

export default function SlateEditor({ documentId, updateSidebarArray }) {
  const navigate = useNavigate();
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    editor.children = JSON.parse(sessionStorage.getItem(documentId)) || [
      {
        type: "heading-one",
        children: [{ text: "" }],
      },
    ];
    setLoading(false);
  }, [documentId, editor, content]);
  const accessToken = localStorage.accessToken;
  if (accessToken === "" || accessToken === null || accessToken === undefined) {
    navigate("/error");
  }

  useEffect(() => {
    var getData = async () => {
      try {
        setLoading(true);
        var res = await axios.get(
          `${process.env.REACT_APP_SERVER_LINK}/documents/${documentId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        var parsedData = JSON.parse(res.data)["data"];
        if (parsedData === null) {
          var data = [
            {
              type: "heading-one",
              children: [{ text: "" }],
            },
          ];
          sessionStorage.setItem(`${documentId}`, JSON.stringify(data));
          setContent(data);
          setLoading(false);
          return data;
        } else {
          sessionStorage.setItem(`${documentId}`, parsedData);
          setContent(parsedData);
          setLoading(false);
          return parsedData;
        }
      } catch (error) {
        setLoading(false);
        navigate("/error");
      }
    };
    getData();
  }, [navigate, documentId, editor, accessToken]);

  const LIST_TYPES = useMemo(() => ["numbered-list", "bulleted-list"], []);
  const [showMenu, setShowMenu] = useState(false);
  const [coordinates, setCoordinates] = useState("");
  const allowedTags = [
    {
      label: "Text",
      value: "paragraph",
      subtext: "Just start writing with plain text.",
    },
    {
      label: "Heading 1",
      value: "heading-one",
      subtext: "Big section heading.",
    },
    {
      label: "Heading 2",
      value: "heading-two",
      subtext: "Medium section heading.",
    },
    {
      label: "Heading 3",
      value: "heading-three",
      subtext: "Small section heading.",
    },
    {
      label: "Bulleted list",
      value: "bulleted-list",
      subtext: "Create a simple bulleted list.",
    },
    {
      label: "Numbered list",
      value: "numbered-list",
      subtext: "Create a list with numbering.",
    },
    {
      label: "To-do list",
      value: "check-list",
      subtext: "Track tasks with a to-do list.",
    },
    {
      label: "Quote",
      value: "block-quote",
      subtext: "Capture a quote.",
    },
  ];
  //eslint-disable-next-line
  const [menuOptions, setMenuOptions] = useState(allowedTags);
  const [documentName, setDocumentName] = useState("");
  const [sharingMenu, setSharingMenu] = useState(false);
  const [publicSharing, setPublicSharing] = useState(false);
  const [sharedEmailFromUser, setSharedEmailFromUser] = useState("");
  const menuFocus = createRef();

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setsnackbarSeverity] = useState("error");

  useEffect(() => {
    menuFocus.current?.focus();
  }, [menuFocus]);

  const headingOneElement = (props) => (
    <h1 {...props.attributes}>{props.children}</h1>
  );

  const headingTwoElement = (props) => (
    <h2 {...props.attributes}>{props.children}</h2>
  );

  const headingThreeElement = (props) => (
    <h3 {...props.attributes}>{props.children}</h3>
  );

  const numberedListElement = (props) => (
    <ol {...props.attributes} className="editor__styles--numbered">
      {props.children}
    </ol>
  );

  const bulletedListElement = (props) => (
    <ul {...props.attributes} className="editor__styles--bulleted">
      {props.children}
    </ul>
  );

  const listItemElement = (props) => (
    <li {...props.attributes} className="editor__styles--bulleted">
      {props.children}
    </li>
  );

  const onChangeChecklist = useCallback(
    (e, props) => {
      const path = ReactEditor.findPath(editor, props.element);
      const newProperties = {
        checked: e.target.checked,
      };
      Transforms.setNodes(editor, newProperties, { at: path });
    },
    [editor]
  );

  const checkListElement = useCallback(
    (props) => {
      return (
        <span className="editor__styles--checklist">
          <input
            {...props.attributes}
            type="checkbox"
            className="editor__styles--checklist-input"
            checked={props.children[0].props.parent.checked}
            onChange={(e) => {
              onChangeChecklist(e, props);
            }}
          />
          {props.children}
        </span>
      );
    },
    [onChangeChecklist]
  );

  const blockQuoteElement = (props) => (
    <blockquote {...props.attributes} className="editor__styles--quote">
      {props.children}
    </blockquote>
  );

  const renderElement = useCallback(
    (props) => {
      switch (props.element.type) {
        case "heading-one":
          return headingOneElement(props);
        case "heading-two":
          return headingTwoElement(props);
        case "heading-three":
          return headingThreeElement(props);
        case "numbered-list":
          return numberedListElement(props);
        case "bulleted-list":
          return bulletedListElement(props);
        case "check-list":
          return checkListElement(props);
        case "list-item":
          return listItemElement(props);
        case "block-quote":
          return blockQuoteElement(props);
        default:
          return <p {...props.attributes}>{props.children}</p>;
      }
    },
    [checkListElement]
  );

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.code) {
      children = <code className="editor__styles--code">{children}</code>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.underline) {
      children = <u>{children}</u>;
    }

    if (leaf.strikeThrough) {
      children = <del>{children}</del>;
    }

    if (leaf.hyperLink) {
      children = (
        <a
          href={
            children.props.leaf.text.includes("http")
              ? `${children.props.leaf.text}`
              : `//${children.props.leaf.text}`
          }
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      );
    }

    return <span {...attributes}>{children}</span>;
  };

  function isMarkActive(editor, format) {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  }

  function isBlockActive(editor, format) {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
      })
    );

    return !!match;
  }

  const toggleMark = useCallback((editor, format) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  }, []);

  const toggleBlock = useCallback(
    (editor, format) => {
      const isActive = isBlockActive(editor, format);
      const isList = LIST_TYPES.includes(format);
      const isChecklist = format === "check-list";

      Transforms.unwrapNodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          LIST_TYPES.includes(n.type),
        split: true,
      });
      const newProperties = {
        type: isActive ? "paragraph" : isList ? "list-item" : format,
      };
      Transforms.setNodes(editor, newProperties);

      if (!isActive && isList) {
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
      }

      if (!isActive && isChecklist) {
        const block = { type: format, children: [], checked: false };
        Transforms.setNodes(editor, block);
      }
    },
    [LIST_TYPES]
  );

  const getCoordinates = () => {
    let x, y;
    const selection = window.getSelection();
    if (selection.rangeCount !== 0) {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(false);
      const rect = range.getClientRects()[0];
      if (rect) {
        x = rect.top;
        y = rect.left;
      }
      return { top: x > 350 ? x - 350 : x + 20, left: y + 5 };
    } else {
      alert("Internal server error, please try again later");
    }
  };

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const openMenu = useCallback(() => {
    const position = getCoordinates();
    setCoordinates(position);
    setShowMenu(true);
  }, [setCoordinates, setShowMenu]);

  const menuOnKeyDown = useCallback(
    (event) => {
      if (
        event.key === " " ||
        event.key === "Backspace" ||
        event.key === "Escape"
      ) {
        event.preventDefault();
        closeMenu();
        ReactEditor.focus(editor);
      }

      if (event.key === "Enter") {
        event.preventDefault();
      }
    },
    [closeMenu, editor]
  );

  var onClickMenu = useCallback(
    (item) => {
      toggleBlock(editor, item.value);
      editor.deleteBackward();
      closeMenu();
      ReactEditor.focus(editor);
    },
    [closeMenu, editor, toggleBlock]
  );

  const markdownListMenuOptions = menuOptions.map((item, key) => {
    return (
      <MenuItem
        className="editor__menu--item"
        key={key}
        onClick={() => onClickMenu(item)}
      >
        <p className="editor__menu--item-label">{item.label}</p>
        <p className="editor__menu--item-subtext">{item.subtext}</p>
      </MenuItem>
    );
  });

  const MarkdownListMenu = useCallback(() => {
    return (
      <Menu
        className="editor__menu"
        style={coordinates}
        ref={menuFocus}
        onKeyDown={menuOnKeyDown}
      >
        {markdownListMenuOptions}
      </Menu>
    );
  }, [markdownListMenuOptions, coordinates, menuFocus, menuOnKeyDown]);

  const RenderMarkdownListMenu = useCallback(() => {
    return showMenu ? showMenu && <MarkdownListMenu /> : null;
  }, [showMenu]);

  useEffect(() => {
    showMenu
      ? document.addEventListener("click", closeMenu)
      : document.removeEventListener("click", closeMenu);
  }, [showMenu, closeMenu]);

  const editorOnKeyDown = useCallback(
    (event) => {
      if (event.key === "/") {
        editor.insertText("/");
        openMenu();
      }

      if (editor.children[0].type !== "heading-one") {
        Transforms.setNodes(editor, { type: "heading-one" }, { at: [0] });
      }

      if (editor.selection.anchor.path[0] === 0 && event.key === "/") {
        editor.deleteBackward();
        closeMenu();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const isList = LIST_TYPES.includes(editor.getFragment()[0].type);
        const isChecklist = editor.getFragment()[0].type === "check-list";
        if (isList) {
          const listLength =
            editor.children[editor.selection.anchor.path[0]].children[
              editor.selection.anchor.path[1]
            ].children[0].text.length;
          const listType = editor.getFragment()[0].type;
          if (listLength === 0) {
            event.preventDefault();
            toggleBlock(editor, listType);
          } else {
            return Transforms.insertNodes(editor, {
              type: "list-item",
              children: [{ text: "" }],
            });
          }
        } else if (isChecklist) {
          const listLength =
            editor.children[editor.selection.anchor.path[0]].children[
              editor.selection.anchor.path[1]
            ].text.length;
          const listType = editor.getFragment()[0].type;
          if (listLength === 0) {
            event.preventDefault();
            toggleBlock(editor, listType);
          } else {
            return Transforms.insertNodes(editor, {
              type: "check-list",
              children: [{ text: "" }],
              checked: false,
            });
          }
        } else {
          Transforms.insertNodes(editor, {
            type: "paragraph",
            children: [{ text: "" }],
          });
        }
      }

      if (event.key === "Backspace") {
        const isList = LIST_TYPES.includes(editor.getFragment()[0].type);
        const isChecklist = editor.getFragment()[0].type === "check-list";
        if (isList) {
          const listLength =
            editor.children[editor.selection.anchor.path[0]].children[
              editor.selection.anchor.path[1]
            ].children[0].text.length;
          const listType = editor.getFragment()[0].type;
          if (listLength === 0) {
            event.preventDefault();
            toggleBlock(editor, listType);
          }
        } else if (isChecklist) {
          const checklistLength =
            editor.children[editor.selection.anchor.path[0]].children[0].text
              .length;
          if (checklistLength === 0) {
            event.preventDefault();
            Transforms.setNodes(editor, {
              type: "paragraph",
              children: [{ text: "" }],
            });
          }
        } else {
          return null;
        }
      }

      const keyboardShortucts = {
        "mod+b": "bold",
        "mod+i": "italic",
        "mod+u": "underline",
        "mod+s": "strikeThrough",
        "mod+e": "code",
        "mod+a": "hyperLink",
      };

      for (const hotkey in keyboardShortucts) {
        if (isHotkey(hotkey, event)) {
          event.preventDefault();
          const mark = keyboardShortucts[hotkey];
          toggleMark(editor, mark);
        }
      }

      if (event.key === "c" && event.ctrlKey) {
        navigator.clipboard.writeText(Editor.string(editor, editor.selection));
      }

      if (event.key === "x" && event.ctrlKey) {
        navigator.clipboard.writeText(Editor.string(editor, editor.selection));
        editor.deleteFragment();
      }
    },
    [editor, openMenu, closeMenu, LIST_TYPES, toggleBlock, toggleMark]
  );

  const editorOnChange = useCallback(
    (newValue) => {
      setContent(newValue);
      const isAstChange = editor.operations.some(
        (op) => "set_selection" !== op.type
      );
      if (isAstChange) {
        const content = JSON.stringify(newValue);
        const name = editor.children[0].children[0].text;
        sessionStorage.setItem(documentId, content);
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        };
        if (documentName !== name) {
          updateSidebarArray(name);
          setDocumentName(name);
          axios.post(
            `${process.env.REACT_APP_SERVER_LINK}/documents/${documentId}`,
            { data: content, name: name },
            config
          );
        } else {
          axios.post(
            `${process.env.REACT_APP_SERVER_LINK}/documents/${documentId}`,
            { data: content },
            config
          );
        }
      }
    },
    [documentId, editor, accessToken, updateSidebarArray, documentName]
  );

  const closeSharingMenu = useCallback(() => {
    setSharingMenu(false);
  }, []);

  const submitSharingRequest = useCallback(
    async (e) => {
      try {
        e.preventDefault();
        var config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        };
        var res = await axios.post(
          `${process.env.REACT_APP_SERVER_LINK}/documents/${documentId}/share`,
          {
            email: sharedEmailFromUser,
          },
          config
        );
        if (res.status === 200) {
          setOpenSnackbar(true);
          setsnackbarSeverity("success");
          setSnackbarMessage("Document shared.");
        }
      } catch (error) {
        if (error.response.status === 403) {
          setOpenSnackbar(true);
          setsnackbarSeverity("error");
          setSnackbarMessage(
            "You're not the owner of this document, so can't share it."
          );
        } else {
          setOpenSnackbar(true);
          setsnackbarSeverity("error");
          setSnackbarMessage("Couldn't share, please try again");
        }
      }
    },
    [accessToken, documentId, sharedEmailFromUser]
  );

  const handleSwitchChange = useCallback(
    async (e) => {
      try {
        let target = e.target.checked;
        console.log(target);
        var config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        };
        var res = await axios.post(
          `${process.env.REACT_APP_SERVER_LINK}/documents/${documentId}/share`,
          {
            email: localStorage.getItem("ownerEmail"),
            public: target,
          },
          config
        );
        if (res.status === 200) {
          setPublicSharing(target);
          setOpenSnackbar(true);
          setsnackbarSeverity("success");
          setSnackbarMessage("Document sharing changed.");
        }
      } catch (error) {
        if (error.response.status === 403) {
          setOpenSnackbar(true);
          setsnackbarSeverity("error");
          setSnackbarMessage(
            "You're not the owner of this document, so can't share it."
          );
        } else {
          setOpenSnackbar(true);
          setsnackbarSeverity("error");
          setSnackbarMessage("Couldn't share, please try again");
        }
      }
    },
    [accessToken, documentId]
  );

  const handleSharedUserChange = useCallback((e) => {
    setSharedEmailFromUser(e.target.value);
  }, []);

  const SharingMenu = useCallback(() => {
    return (
      <div className="editor__share--menu">
        <form onSubmit={(e) => submitSharingRequest(e)}>
          <button
            className="editor__share--menu-closeBtn"
            onClick={() => closeSharingMenu()}
          >
            X
          </button>
          <div>
            <input
              className="editor__share--menu-input"
              type="text"
              placeholder="Email to share the document with..."
              value={sharedEmailFromUser}
              onChange={(e) => handleSharedUserChange(e)}
            />
            <button className="editor__share--menu-btn" type="submit">
              ADD
            </button>
          </div>
        </form>
        <FormControlLabel
          label="Public:"
          labelPlacement="start"
          control={
            <Switch
              checked={publicSharing}
              onChange={(e) => handleSwitchChange(e)}
            />
          }
        />
        {publicSharing ? (
          <div>
            <input
              readOnly
              className="editor__share--menu-input"
              value={`https://open-source-notion.manthankumbhar.com/shared/${documentId}`}
            />
            <button
              className="editor__share--menu-btn"
              onClick={() =>
                navigator.clipboard.writeText(
                  `open-source-notion.manthankumbhar.com/shared/${documentId}`
                )
              }
            >
              Copy
            </button>
          </div>
        ) : null}
      </div>
    );
  }, [
    closeSharingMenu,
    submitSharingRequest,
    documentId,
    publicSharing,
    handleSwitchChange,
    handleSharedUserChange,
    sharedEmailFromUser,
  ]);

  const RenderSharingMenu = useCallback(() => {
    return sharingMenu ? SharingMenu() : null;
  }, [SharingMenu, sharingMenu]);

  const shareBtnOnClick = useCallback(() => {
    setSharingMenu(true);
  }, []);

  return (
    <div className="editor">
      <SnackBar
        setOpenSnackBar={setOpenSnackbar}
        openSnackBar={openSnackbar}
        snackBarSeverity={snackbarSeverity}
        snackBarMessage={snackbarMessage}
      />
      <Slate
        editor={editor}
        value={content}
        onChange={(newValue) => editorOnChange(newValue)}
      >
        <RenderMarkdownListMenu />
        {RenderSharingMenu()}
        {loading ? (
          <div className="editor__loading">
            <CircularProgress size={40} color="secondary" />
          </div>
        ) : (
          <div>
            <div className="editor__share">
              <button
                className="editor__share--btn"
                onClick={() => shareBtnOnClick()}
              >
                Share
              </button>
            </div>
            <Editable
              className="editor__area"
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onKeyDown={editorOnKeyDown}
              placeholder={"Document Title!"}
            />
          </div>
        )}
      </Slate>
    </div>
  );
}
