import Reified from "./Reified"

export default class LinkedEntities {

	linkedEntities:any

	constructor(linkedEntities:any) {
		this.linkedEntities = {...linkedEntities}
	}

	mergeWith(linkedEntities:any):LinkedEntities {
		return new LinkedEntities({ ...this.linkedEntities, linkedEntities })
	}

	getLabelForIri(iri:string):string|undefined {

		let linkedEntity = this.linkedEntities[iri]

		if(linkedEntity) {
			let label = Reified.fromJson<string>( linkedEntity.label )
			if(label && label.length > 0) {
				return label[0].value
			}
		}
	}

	get(iri:string) {
		return this.linkedEntities[iri]
	}
}