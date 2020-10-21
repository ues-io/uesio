import { component } from "uesio";
import buttonsetbuilder from "../components/buttonset/buttonsetbuilder";
import buttonbuilder from "../components/button/buttonbuilder";
import cardbuilder from "../components/card/cardbuilder";
import columnbuilder from "../components/column/columnbuilder";
import containerbuilder from "../components/container/containerbuilder";
import deckbuilder from "../components/deck/deckbuilder";
import gridbuilder from "../components/grid/gridbuilder";
import griditembuilder from "../components/griditem/griditembuilder";
import imagebuilder from "../components/image/imagebuilder";
import iconbuilder from "../components/icon/iconbuilder";
import tablebuilder from "../components/table/tablebuilder";
import typographybuilder from "../components/typography/typographybuilder";
import imageuploadbuilder from "../components/imageupload/imageuploadbuilder";
import fileuploadbuilder from "../components/fileupload/fileuploadbuilder";
import buttonsetdefinition from "../components/buttonset/buttonsetdefinition";
import buttondefinition from "../components/button/buttondefinition";
import carddefinition from "../components/card/carddefinition";
import columndefinition from "../components/column/columndefinition";
import containerdefinition from "../components/container/containerdefinition";
import deckdefinition from "../components/deck/deckdefinition";
import griddefinition from "../components/grid/griddefinition";
import griditemdefinition from "../components/griditem/griditemdefinition";
import imagedefinition from "../components/image/imagedefinition";
import icondefinition from "../components/icon/icondefinition";
import tabledefinition from "../components/table/tabledefinition";
import typographydefinition from "../components/typography/typographydefinition";
import imageuploaddefinition from "../components/imageupload/imageuploaddefinition";
import fileuploaddefinition from "../components/fileupload/fileuploaddefinition";
component.registry.registerBuilder("material", "buttonset", buttonsetbuilder, buttonsetdefinition);
component.registry.registerBuilder("material", "button", buttonbuilder, buttondefinition);
component.registry.registerBuilder("material", "card", cardbuilder, carddefinition);
component.registry.registerBuilder("material", "column", columnbuilder, columndefinition);
component.registry.registerBuilder("material", "container", containerbuilder, containerdefinition);
component.registry.registerBuilder("material", "deck", deckbuilder, deckdefinition);
component.registry.registerBuilder("material", "grid", gridbuilder, griddefinition);
component.registry.registerBuilder("material", "griditem", griditembuilder, griditemdefinition);
component.registry.registerBuilder("material", "image", imagebuilder, imagedefinition);
component.registry.registerBuilder("material", "icon", iconbuilder, icondefinition);
component.registry.registerBuilder("material", "table", tablebuilder, tabledefinition);
component.registry.registerBuilder("material", "typography", typographybuilder, typographydefinition);
component.registry.registerBuilder("material", "imageupload", imageuploadbuilder, imageuploaddefinition);
component.registry.registerBuilder("material", "fileupload", fileuploadbuilder, fileuploaddefinition);