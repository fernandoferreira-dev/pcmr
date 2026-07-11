import '../../styles/user-info-styles/user-data-styles.css' 

type Props = { selectedOption: string };

export default function LangPrefComponent({ selectedOption }: Props) {
    return (
        <>
                <div className="user-info-main-box">
                    <div className="user-data-box">
                        <h2>Preferência de Idioma</h2>
                        <p>{selectedOption}</p>
                    </div>
                 </div>
 
        </>
    )
}